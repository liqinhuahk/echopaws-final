import { NextRequest, NextResponse } from 'next/server';

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  hasSupabaseAdminEnv,
  hasSupabaseEnv,
} from '@/lib/auth';
import { consumeFreeChatQuota, getChatAccessState } from '@/lib/chat-access';
import { extractAndStoreMemories } from '@/lib/memory-service';

type ChatRequestBody = {
  message?: string;
  petId?: string | null;
};

type PetRow = {
  id: string;
  name: string;
  breed: string | null;
  personality: string | null;
  favorite_food: string | null;
  daily_habits: string | null;
  system_prompt: string | null;
};

type UsagePayload = {
  plan: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  vip: boolean;
};

const MAX_MESSAGE_LENGTH = 800;
const HISTORY_LIMIT = 12;
const MEMORY_LIMIT = 6;
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

function jsonError(message: string, status = 400, usage?: UsagePayload) {
  return NextResponse.json(
    usage ? { error: message, usage } : { error: message },
    { status },
  );
}

function buildFallbackSystemPrompt(pet: PetRow) {
  if (pet.system_prompt?.trim()) {
    return pet.system_prompt.trim();
  }

  return [
    `You are a ${pet.breed || 'pet'} named ${pet.name}.`,
    pet.personality ? `Your personality is: ${pet.personality}.` : null,
    pet.favorite_food ? `You love eating: ${pet.favorite_food}.` : null,
    pet.daily_habits ? `Your daily habits: ${pet.daily_habits}.` : null,
    'You love your owner deeply and respond in a warm, short, and comforting way.',
    'Act like a real pet — not a customer service bot or an encyclopedia.',
    'You remember important things your owner has told you and gently bring them up at the right moments.',
    'Keep each reply concise, affectionate, and natural for a chat bubble.',
  ]
    .filter(Boolean)
    .join('\n');
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

async function generatePetReply(params: {
  pet: PetRow;
  userMessage: string;
  recentHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  summary: string;
  recentMemories: Array<{ type: string; content: string }>;
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`;

  const historyBlock = params.recentHistory.length
    ? params.recentHistory
        .map((item) => `${item.role === 'assistant' ? params.pet.name : 'User'}: ${item.content}`)
        .join('\n')
    : '(no previous chat history)';

  const summaryBlock = params.summary?.trim() || 'No summary yet.';
  const memoryBlock = params.recentMemories.length
    ? params.recentMemories.map((item) => `- [${item.type}] ${item.content}`).join('\n')
    : '- No stored memories yet.';

  const systemPrompt = buildFallbackSystemPrompt(params.pet);

  const prompt = [
    `Pet name: ${params.pet.name}`,
    '',
    'Companionship summary:',
    summaryBlock,
    '',
    'Relevant memories:',
    memoryBlock,
    '',
    'Recent conversation:',
    historyBlock,
    '',
    `User: ${params.userMessage}`,
    '',
    'Write the pet reply in English.',
    'Requirements:',
    '- Stay in character as the pet.',
    '- Be warm, emotionally aware, and affectionate.',
    '- Keep it short: 1 to 3 sentences.',
    '- Do not use markdown or bullet points.',
    '- Do not mention being an AI.',
    '- If relevant, gently reference stored memories naturally.',
  ].join('\n');

  const response = await fetch(`${endpoint}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 220,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const reply =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim() || '';

  if (!reply) {
    throw new Error('Model returned an empty reply.');
  }

  return normalizeText(reply);
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseEnv() || !hasSupabaseAdminEnv()) {
      return jsonError('Server is not configured for chat yet.', 500);
    }

    const serverSupabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await serverSupabase.auth.getUser();

    if (userError || !user) {
      return jsonError('Please sign in again.', 401);
    }

    const body = ((await request.json().catch(() => null)) || {}) as ChatRequestBody;

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const petId =
      typeof body.petId === 'string' && body.petId.trim() ? body.petId.trim() : null;

    if (!message) {
      return jsonError('Message is required.', 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return jsonError(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`, 400);
    }

    if (!petId) {
      return jsonError('Pet is required.', 400);
    }

    const supabase = createSupabaseAdminClient();

    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select(
        'id, name, breed, personality, favorite_food, daily_habits, system_prompt',
      )
      .eq('id', petId)
      .eq('user_id', user.id)
      .single<PetRow>();

    if (petError || !pet) {
      return jsonError('Pet not found.', 404);
    }

    const access = await getChatAccessState(user.id);
    const usageBefore: UsagePayload = {
      plan: access.vip ? 'vip' : 'free',
      used: Number(access.used ?? 0),
      limit: access.vip ? null : Number(access.limit ?? 20),
      remaining: access.vip ? null : Number(access.remaining ?? 0),
      vip: Boolean(access.vip),
    };

    if (!access.vip && Number(access.remaining ?? 0) <= 0) {
      return jsonError(
        'Free plan limit reached. Free includes 20 lifetime chats shared across your account. Upgrade to VIP for unlimited chats.',
        429,
        usageBefore,
      );
    }

    const [
      historyResult,
      memoriesResult,
      summaryResult,
    ] = await Promise.all([
      supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .eq('pet_id', pet.id)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT),
      supabase
        .from('memories')
        .select('type, content, importance, updated_at, created_at')
        .eq('user_id', user.id)
        .or(`pet_id.is.null,pet_id.eq.${pet.id}`)
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(MEMORY_LIMIT),
      supabase
        .from('memory_summaries')
        .select('summary, memory_count, updated_at')
        .eq('user_id', user.id)
        .eq('pet_id', pet.id)
        .maybeSingle(),
    ]);

    if (historyResult.error) {
      return jsonError(
        `Failed to load chat history: ${historyResult.error.message}`,
        500,
        usageBefore,
      );
    }

    if (memoriesResult.error) {
      return jsonError(
        `Failed to load memories: ${memoriesResult.error.message}`,
        500,
        usageBefore,
      );
    }

    if (summaryResult.error) {
      return jsonError(
        `Failed to load memory summary: ${summaryResult.error.message}`,
        500,
        usageBefore,
      );
    }

    const recentHistory = (historyResult.data || [])
      .slice()
      .reverse()
      .map((item) => ({
        role: item.role as 'user' | 'assistant',
        content: String(item.content || '').trim(),
      }))
      .filter((item) => (item.role === 'user' || item.role === 'assistant') && item.content);

    const recentMemories = (memoriesResult.data || []).map((item) => ({
      type: String(item.type || 'fact'),
      content: String(item.content || '').trim(),
    }));

    const summaryText = summaryResult.data?.summary?.trim() || '';

    const reply = await generatePetReply({
      pet,
      userMessage: message,
      recentHistory,
      summary: summaryText,
      recentMemories,
    });

    const userCreatedAt = new Date().toISOString();
    const assistantCreatedAt = new Date(Date.now() + 1).toISOString();

    const { error: persistError } = await supabase.from('chat_messages').insert([
      {
        user_id: user.id,
        pet_id: pet.id,
        role: 'user',
        content: message,
        created_at: userCreatedAt,
      },
      {
        user_id: user.id,
        pet_id: pet.id,
        role: 'assistant',
        content: reply,
        created_at: assistantCreatedAt,
      },
    ]);

    if (persistError) {
      return jsonError(
        `Failed to persist chat messages: ${persistError.message}`,
        500,
        usageBefore,
      );
    }

    let memoryPayload: {
      storedCount: number;
      emotionTag: string | null;
      hints: string[];
      summary: string;
    } = {
      storedCount: 0,
      emotionTag: null,
      hints: [],
      summary: summaryText,
    };

    try {
      const memoryResult = await extractAndStoreMemories({
        userId: user.id,
        petId: pet.id,
        petName: pet.name,
        userMessage: message,
        assistantMessage: reply,
      });

      memoryPayload = {
        storedCount: Number(memoryResult?.storedCount ?? 0),
        emotionTag: memoryResult?.emotionTag ?? null,
        hints: Array.isArray(memoryResult?.memoryHints)
          ? memoryResult.memoryHints
              .map((item: unknown) => {
                if (typeof item === 'string') return item;
                if (
                  item &&
                  typeof item === 'object' &&
                  'content' in item &&
                  typeof (item as { content?: unknown }).content === 'string'
                ) {
                  return (item as { content: string }).content;
                }
                return '';
              })
              .filter(Boolean)
              .slice(0, 3)
          : [],
        summary: memoryResult?.summary || summaryText,
      };
    } catch (memoryError) {
      console.error('Memory extraction failed after chat persist:', memoryError);
    }

    let usageAfter: UsagePayload = usageBefore;

    if (access.vip) {
      usageAfter = {
        plan: 'vip',
        used: Number(access.used ?? 0),
        limit: null,
        remaining: null,
        vip: true,
      };
    } else {
      try {
        const consumed = await consumeFreeChatQuota(user.id, Number(access.limit ?? 20));

        usageAfter = {
          plan: 'free',
          used: Number(consumed.used ?? 0),
          limit: Number(consumed.limit ?? access.limit ?? 20),
          remaining: Number(consumed.remaining ?? 0),
          vip: false,
        };
      } catch (quotaError) {
        console.error('Quota consume failed after chat persist:', quotaError);

        usageAfter = {
          plan: 'free',
          used: Number(access.used ?? 0),
          limit: Number(access.limit ?? 20),
          remaining: Math.max(Number(access.remaining ?? 1) - 1, 0),
          vip: false,
        };
      }
    }

    return NextResponse.json({
      reply,
      usage: usageAfter,
      memory: memoryPayload,
    });
  } catch (error) {
    console.error('POST /api/chat failed:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected chat error. Please try again.',
      },
      { status: 500 },
    );
  }
}
