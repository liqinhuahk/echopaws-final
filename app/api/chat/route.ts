import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import {
  consumeFreeChatQuota,
  FREE_TOTAL_CHAT_LIMIT,
  getChatAccessState,
} from '@/lib/chat-access';
import {
  generatePetReply,
  getPrimaryPetAndContext,
  persistConversation,
} from '@/lib/chat-service';
import { extractAndStoreMemories } from '@/lib/memory-service';

function buildUsagePayload(params: {
  plan: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  vip: boolean;
}) {
  return {
    plan: params.plan,
    used: params.used,
    limit: params.limit,
    remaining: params.remaining,
    vip: params.vip,
  };
}

function buildFreeLimitError(usage: {
  used: number;
  limit: number | null;
  remaining: number | null;
  vip: boolean;
}) {
  return {
    error: `Free plan limit reached. Free includes ${FREE_TOTAL_CHAT_LIMIT} lifetime chats shared across your account. Upgrade to VIP for unlimited chats.`,
    usage: buildUsagePayload({
      plan: 'free',
      used: usage.used,
      limit: usage.limit,
      remaining: usage.remaining,
      vip: false,
    }),
  };
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return Response.json(
      { error: 'Please configure Supabase environment variables.' },
      { status: 500 },
    );
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: 'Please log in before chatting.' },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { message?: string; petId?: string | null }
    | null;

  const message = body?.message?.trim();
  const petId = body?.petId?.trim() || null;

  if (!message) {
    return Response.json(
      { error: 'Message cannot be empty.' },
      { status: 400 },
    );
  }

  if (message.length > 800) {
    return Response.json(
      { error: 'Each message must be 800 characters or fewer.' },
      { status: 400 },
    );
  }

  const accessState = await getChatAccessState(user.id);

  if (!accessState.vip && (accessState.remaining ?? 0) <= 0) {
    return Response.json(
      buildFreeLimitError({
        used: accessState.used,
        limit: accessState.limit,
        remaining: accessState.remaining,
        vip: false,
      }),
      { status: 429 },
    );
  }

  const { pet, memories, history, memorySummary } = await getPrimaryPetAndContext(
    user.id,
    petId,
  );

  if (!pet) {
    return Response.json(
      { error: 'Please create your first pet before chatting.' },
      { status: 400 },
    );
  }

  const reply = await generatePetReply({
    message,
    pet,
    memories,
    memorySummary,
    history,
  });

  let usagePayload = buildUsagePayload({
    plan: accessState.vip ? 'vip' : accessState.subscription?.plan || 'free',
    used: accessState.used,
    limit: accessState.limit,
    remaining: accessState.remaining,
    vip: accessState.vip,
  });

  if (!accessState.vip) {
    const consumed = await consumeFreeChatQuota(user.id);

    if (!consumed.allowed) {
      return Response.json(
        buildFreeLimitError({
          used: consumed.used,
          limit: consumed.limit,
          remaining: consumed.remaining,
          vip: false,
        }),
        { status: 429 },
      );
    }

    usagePayload = buildUsagePayload({
      plan: 'free',
      used: consumed.used,
      limit: consumed.limit,
      remaining: consumed.remaining,
      vip: false,
    });
  }

  let memoryPayload = {
    storedCount: 0,
    emotionTag: null as string | null,
    memoryHints: [] as string[],
    summary: memorySummary?.summary || '',
  };

  try {
    memoryPayload = await extractAndStoreMemories({
      userId: user.id,
      petId: pet.id ?? null,
      petName: pet.name,
      userMessage: message,
      assistantMessage: reply,
    });
  } catch {
    memoryPayload = {
      storedCount: 0,
      emotionTag: null,
      memoryHints: [],
      summary: memorySummary?.summary || '',
    };
  }

  try {
    await persistConversation({
      userId: user.id,
      petId: pet.id ?? null,
      userMessage: message,
      assistantMessage: reply,
      userEmotionTag: memoryPayload.emotionTag,
    });
  } catch {
    return Response.json(
      { error: 'Failed to save conversation, please try again.' },
      { status: 500 },
    );
  }

  return Response.json({
    reply,
    pet: {
      id: pet.id,
      name: pet.name,
      imageUrl: pet.image_url,
    },
    usage: usagePayload,
    memory: {
      storedCount: memoryPayload.storedCount,
      emotionTag: memoryPayload.emotionTag,
      hints: memoryPayload.memoryHints,
      summary: memoryPayload.summary,
    },
  });
}
