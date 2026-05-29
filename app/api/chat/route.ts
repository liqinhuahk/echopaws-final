import { NextResponse } from 'next/server';
import { consumeFreeChatQuota, getChatAccessStatus } from '@/lib/chat-access';
import { extractAndStoreMemories } from '@/lib/memory-service';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatRequestBody = {
  message?: unknown;
  petId?: unknown;
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

type ChatMessageRow = {
  role: 'user' | 'assistant';
  content: string;
};

type MemoryRow = {
  content: string;
  type: string | null;
  importance: number | null;
};

type MemorySummaryRow = {
  summary: string;
  memory_count: number | null;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function defaultSystemPrompt(pet: PetRow) {
  return [
    `You are a ${pet.breed || 'pet'} named ${pet.name}.`,
    pet.personality ? `Your personality is: ${pet.personality}.` : null,
    pet.favorite_food ? `You love eating: ${pet.favorite_food}.` : null,
    pet.daily_habits ? `Your daily habits: ${pet.daily_habits}.` : null,
    'You love your owner deeply and respond in a warm, affectionate, short, and comforting way.',
    'Act like a real pet — not a customer service bot or encyclopedia.',
    'Keep replies concise, emotionally warm, and natural for a pet companion app.',
    'When suitable, you may include gentle pet-like action text such as *blinks slowly* or *nuzzles your hand*.',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildFallbackReply(pet: PetRow, userMessage: string) {
  const text = userMessage.toLowerCase();

  if (/(tired|sleepy|exhausted|fatigued|worn out)/i.test(text)) {
    return `*blinks slowly* Oh, you sound tired. Come here—let's stay close for a while, and you can rest with me, okay?`;
  }

  if (/(sad|upset|down|heartbroken|unhappy)/i.test(text)) {
    return `*nuzzles your hand* I'm here with you. You don't have to carry it all alone—stay with me for a bit, okay?`;
  }

  if (/(happy|excited|great|wonderful|amazing)/i.test(text)) {
    return `*wags happily* That makes me so happy too! Tell me more—I want to share the good feeling with you.`;
  }

  if (/(hello|hi|hey)/i.test(text)) {
    return `*blinks slowly* Hi, I'm ${pet.name}. I'm so happy you're here. Tell me what's on your mind, and let's chat for a while.`;
  }

  return `*blinks slowly* I'm here with you. Tell me more, and I'll stay close and listen.`;
}

async function callGemini(params: {
  systemInstruction: string;
  prompt: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  if (!apiKey) {
    return '';
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: params.systemInstruction }],
          },
          {
            role: 'user',
            parts: [{ text: params.prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 512,
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API failed: ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function resolveSelectedPet(params: {
  userId: string;
  requestedPetId: string;
}) {
  const admin = createSupabaseAdminClient();

  if (params.requestedPetId) {
    const { data, error } = await admin
      .from('pets')
      .select('id, name, breed, personality, favorite_food, daily_habits, system_prompt')
      .eq('user_id', params.userId)
      .eq('id', params.requestedPetId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as PetRow;
  }

  const [{ data: profile, error: profileError }, { data: pets, error: petsError }] = await Promise.all([
    admin.from('profiles').select('default_pet_id').eq('id', params.userId).maybeSingle(),
    admin
      .from('pets')
      .select('id, name, breed, personality, favorite_food, daily_habits, system_prompt')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (profileError) throw profileError;
  if (petsError) throw petsError;

  const petList = (pets ?? []) as PetRow[];
  if (!petList.length) {
    return null;
  }

  const defaultPetId =
    profile && typeof profile === 'object' && 'default_pet_id' in profile
      ? String(profile.default_pet_id || '')
      : '';

  return petList.find((pet) => pet.id === defaultPetId) ?? petList[0];
}

async function fetchChatContext(params: {
  userId: string;
  petId: string;
}) {
  const admin = createSupabaseAdminClient();

  const [{ data: messages }, { data: memories }, { data: summary }] = await Promise.all([
    admin
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', params.userId)
      .eq('pet_id', params.petId)
      .order('created_at', { ascending: false })
      .limit(12),
    admin
      .from('memories')
      .select('content, type, importance')
      .eq('user_id', params.userId)
      .eq('pet_id', params.petId)
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(6),
    admin
      .from('memory_summaries')
      .select('summary, memory_count')
      .eq('user_id', params.userId)
      .eq('pet_id', params.petId)
      .maybeSingle(),
  ]);

  return {
    recentMessages: ((messages ?? []) as ChatMessageRow[]).reverse(),
    recentMemories: (memories ?? []) as MemoryRow[],
    summaryRow: (summary as MemorySummaryRow | null) ?? null,
  };
}

function buildPrompt(params: {
  pet: PetRow;
  userMessage: string;
  recentMessages: ChatMessageRow[];
  recentMemories: MemoryRow[];
  summaryText: string;
}) {
  const conversationBlock = params.recentMessages.length
    ? params.recentMessages
        .map((item) => `${item.role === 'assistant' ? params.pet.name : 'User'}: ${item.content}`)
        .join('\n')
    : 'No recent chat history.';

  const memoryBlock = params.recentMemories.length
    ? params.recentMemories
        .map(
          (item, index) =>
            `${index + 1}. [${item.type || 'memory'} | priority ${item.importance ?? 1}] ${item.content}`,
        )
        .join('\n')
    : 'No saved memories yet.';

  return [
    `Pet name: ${params.pet.name}`,
    `Pet breed: ${params.pet.breed || 'Unknown'}`,
    `Pet personality: ${params.pet.personality || 'Warm and affectionate'}`,
    '',
    'Companionship summary:',
    params.summaryText || 'No current summary.',
    '',
    'Recent memory clues:',
    memoryBlock,
    '',
    'Recent conversation:',
    conversationBlock,
    '',
    `Latest user message: ${params.userMessage}`,
    '',
    'Reply as the pet in English.',
    'Requirements:',
    '- Stay in character as a loving pet companion.',
    '- Keep it concise, natural, affectionate, and emotionally supportive.',
    '- Avoid sounding like an assistant, therapist, or encyclopedia.',
    '- Prefer 1 short paragraph, optionally with one gentle pet action like *blinks slowly*.',
  ].join('\n');
}

async function generatePetReply(params: {
  pet: PetRow;
  userMessage: string;
  recentMessages: ChatMessageRow[];
  recentMemories: MemoryRow[];
  summaryText: string;
}) {
  const systemInstruction = params.pet.system_prompt?.trim() || defaultSystemPrompt(params.pet);
  const prompt = buildPrompt(params);

  try {
    const aiReply = await callGemini({
      systemInstruction,
      prompt,
    });

    if (aiReply) {
      return aiReply;
    }
  } catch (error) {
    console.error('AI reply generation failed, using fallback reply:', error);
  }

  return buildFallbackReply(params.pet, params.userMessage);
}

function buildUsagePayload(value: {
  vip: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
}) {
  return {
    plan: value.vip ? 'vip' : 'free',
    vip: value.vip,
    used: value.used,
    limit: value.limit,
    remaining: value.remaining,
  };
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json(
        {
          error: 'Please configure Supabase first.',
        },
        { status: 500 },
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        {
          error: 'Unable to verify your session. Please sign in again.',
        },
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: 'Please sign in first.',
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ChatRequestBody;
    const message = normalizeText(body.message);
    const requestedPetId = normalizeText(body.petId);

    if (!message) {
      return NextResponse.json(
        {
          error: 'Message is required.',
        },
        { status: 400 },
      );
    }

    if (message.length > 800) {
      return NextResponse.json(
        {
          error: 'Message must be 800 characters or less.',
        },
        { status: 400 },
      );
    }

    const pet = await resolveSelectedPet({
      userId: user.id,
      requestedPetId,
    });

    if (!pet) {
      return NextResponse.json(
        {
          error: 'Please create a pet first before chatting.',
        },
        { status: 400 },
      );
    }

    const accessState = await getChatAccessStatus(user.id);

    let usage = buildUsagePayload({
      vip: accessState.vip,
      used: accessState.used,
      limit: accessState.limit,
      remaining: accessState.remaining,
    });

    if (!accessState.vip) {
      const quota = await consumeFreeChatQuota(user.id);

      if (!quota.allowed) {
        return NextResponse.json(
          {
            error:
              'Free plan limit reached. Free includes 20 lifetime chats shared across your account. Upgrade to VIP for unlimited chats.',
            usage: buildUsagePayload({
              vip: false,
              used: quota.used,
              limit: quota.limit,
              remaining: quota.remaining,
            }),
          },
          { status: 403 },
        );
      }

      usage = buildUsagePayload({
        vip: false,
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
      });
    }

    const context = await fetchChatContext({
      userId: user.id,
      petId: pet.id,
    });

    const summaryText = context.summaryRow?.summary?.trim() || '';

    const reply = await generatePetReply({
      pet,
      userMessage: message,
      recentMessages: context.recentMessages,
      recentMemories: context.recentMemories,
      summaryText,
    });

    const now = new Date().toISOString();
    const admin = createSupabaseAdminClient();

    const { error: messageInsertError } = await admin.from('chat_messages').insert([
      {
        user_id: user.id,
        pet_id: pet.id,
        role: 'user',
        content: message,
        created_at: now,
      },
      {
        user_id: user.id,
        pet_id: pet.id,
        role: 'assistant',
        content: reply,
        created_at: now,
      },
    ]);

    if (messageInsertError) {
      throw new Error(`Failed to persist chat messages: ${messageInsertError.message}`);
    }

    const { error: conversationInsertError } = await admin.from('conversations').insert({
      user_id: user.id,
      pet_id: pet.id,
      created_at: now,
    });

    if (conversationInsertError) {
      console.error('Failed to persist conversations row:', conversationInsertError);
    }

    const memory = await extractAndStoreMemories({
      userId: user.id,
      petId: pet.id,
      petName: pet.name,
      userMessage: message,
      assistantMessage: reply,
    });

    return NextResponse.json({
      reply,
      usage,
      memory: {
        storedCount: memory.storedCount,
        emotionTag: memory.emotionTag,
        hints: memory.memoryHints ?? [],
        summary: memory.summary ?? '',
      },
    });
  } catch (error) {
    console.error('POST /api/chat failed:', error);

    const message =
      error instanceof Error ? error.message : 'Chat request failed. Please try again.';

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
