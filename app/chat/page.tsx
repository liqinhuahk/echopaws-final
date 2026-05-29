import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChatPlayground } from '@/components/chat-playground';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getChatAccessStatus } from '@/lib/chat-access';

type SearchParams = Record<string, string | string[] | undefined>;

type PetRow = {
  id: string;
  name: string;
  breed: string | null;
  personality: string | null;
  favorite_food: string | null;
  daily_habits: string | null;
  image_url: string | null;
  is_default: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type ChatMessageRow = {
  id: string;
  role: 'user' | 'assistant' | string;
  content: string;
  created_at: string | null;
};

type MemoryRow = {
  id: string;
  content: string;
  memory_type: string | null;
  priority: number | null;
  updated_at: string | null;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

function formatUsageLabel(usage: {
  vip?: boolean;
  remaining?: number | null;
  limit?: number | null;
}) {
  if (usage.vip) {
    return 'VIP — Unlimited Chat';
  }

  const remaining = usage.remaining ?? 0;
  const limit = usage.limit ?? 20;

  return `${remaining} / ${limit} lifetime chats left`;
}

function formatDateLabel(value: string | null) {
  if (!value) return 'Recently updated';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'Recently updated';
  }
}

function buildFallbackGreeting(pet: PetRow) {
  const petName = pet.name || 'your pet';
  const personality = pet.personality?.trim();

  if (personality) {
    return `*blinks slowly* Hi, I'm ${petName}. I'm feeling ${personality.toLowerCase()} today. Tell me what's on your mind, and I'll stay right here with you.`;
  }

  return `*blinks slowly* Hi, I'm ${petName}. I'm here with you. Tell me what's on your mind, and let's chat for a while.`;
}

function buildCompanionshipSummary(pet: PetRow, memories: MemoryRow[]) {
  const parts: string[] = [];

  if (pet.personality) {
    parts.push(`${pet.name} usually feels ${pet.personality.toLowerCase()}.`);
  }

  if (pet.favorite_food) {
    parts.push(`Favorite food: ${pet.favorite_food}.`);
  }

  if (pet.daily_habits) {
    parts.push(`Daily habits: ${pet.daily_habits}.`);
  }

  const topMemories = memories
    .filter((item) => item.content?.trim())
    .slice(0, 3)
    .map((item) => item.content.trim());

  if (topMemories.length) {
    parts.push(`Recent companionship clues: ${topMemories.join(' ')}`);
  }

  if (!parts.length) {
    return `${pet.name} is ready to chat. As you talk more, this summary will grow into a clearer companionship snapshot.`;
  }

  return parts.join(' ');
}

function buildCompactTypeLabel(value: string | null) {
  if (!value) return 'Memory';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  if (!hasSupabaseEnv()) {
    redirect('/login?message=Please configure Supabase first.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please sign in first to continue chatting.');
  }

  const requestedPetId = pickParam(searchParams?.pet_id);

  const [{ data: petsData }, usageResult] = await Promise.all([
    supabase
      .from('pets')
      .select(
        'id, name, breed, personality, favorite_food, daily_habits, image_url, is_default, created_at, updated_at',
      )
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false }),
    getChatAccessStatus(user.id).catch(() => null),
  ]);

  const pets = (petsData ?? []) as PetRow[];

  if (!pets.length) {
    return (
      <div className='mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8'>
        <div className='w-full rounded-[32px] border border-orange-100 bg-white p-8 shadow-sm'>
          <div className='text-sm font-bold uppercase tracking-[0.18em] text-orange-600'>
            Chat with Pet
          </div>
          <h1 className='mt-3 text-3xl font-black tracking-tight text-slate-900'>
            Create a pet before you start chatting
          </h1>
          <p className='mt-3 max-w-2xl text-sm leading-7 text-slate-600'>
            Your chat area is ready, but you do not have a pet profile yet. Create one first so
            EchoPaws can remember personality, habits, and companionship history.
          </p>

          <div className='mt-6 flex flex-wrap gap-3'>
            <Link href='/create-pet' className='brand-button'>
              Create Pet
            </Link>
            <Link
              href='/pets'
              className='rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50'
            >
              Manage Pets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedPet =
    pets.find((pet) => pet.id === requestedPetId) ??
    pets.find((pet) => pet.is_default) ??
    pets[0];

  const [{ data: messagesData }, { data: memoriesData }] = await Promise.all([
    // 如果你的项目聊天记录表不是 chat_messages，只改这里的表名即可。
    supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .eq('pet_id', selectedPet.id)
      .order('created_at', { ascending: true })
      .limit(40),
    supabase
      .from('pet_memories')
      .select('id, content, memory_type, priority, updated_at')
      .eq('user_id', user.id)
      .eq('pet_id', selectedPet.id)
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(6),
  ]);

  const rawMessages = ((messagesData ?? []) as ChatMessageRow[]).filter(
    (item) =>
      (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string' &&
      item.content.trim().length > 0,
  );

  const initialMessages =
    rawMessages.length > 0
      ? rawMessages.map((item) => ({
          role: item.role as 'user' | 'assistant',
          content: item.content,
        }))
      : [{ role: 'assistant' as const, content: buildFallbackGreeting(selectedPet) }];

  const recentMemories = (memoriesData ?? []) as MemoryRow[];
  const summaryText = buildCompanionshipSummary(selectedPet, recentMemories);
  const usageLabel = formatUsageLabel(
    usageResult ?? {
      vip: false,
      remaining: 20,
      limit: 20,
    },
  );

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mb-6 rounded-[30px] border border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 p-6 shadow-sm'>
        <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
          Chat with Dog
        </div>
        <div className='mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h1 className='text-3xl font-black tracking-tight text-slate-900'>
              Chat with {selectedPet.name}
            </h1>
            <p className='mt-2 max-w-3xl text-sm leading-7 text-slate-600'>
              The chat area now prioritizes conversation space. Long summaries are folded into a
              lighter panel so the message stream stays readable as the companionship history grows.
            </p>
          </div>

          <div className='flex flex-wrap gap-3'>
            <Link
              href={`/memories?pet_id=${encodeURIComponent(selectedPet.id)}`}
              className='rounded-full border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-orange-900 transition hover:bg-orange-50'
            >
              Open Memory Page
            </Link>
            <Link
              href='/pets'
              className='rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50'
            >
              Manage Pets
            </Link>
          </div>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
        <aside className='space-y-5'>
          <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm'>
            <div className='flex items-start gap-4'>
              {selectedPet.image_url ? (
                <img
                  src={selectedPet.image_url}
                  alt={selectedPet.name}
                  className='h-20 w-20 rounded-[22px] object-cover'
                />
              ) : (
                <div className='flex h-20 w-20 items-center justify-center rounded-[22px] bg-orange-100 text-3xl'>
                  🐶
                </div>
              )}

              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h2 className='truncate text-xl font-black text-slate-900'>{selectedPet.name}</h2>
                  {selectedPet.is_default ? (
                    <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700'>
                      Primary
                    </span>
                  ) : null}
                </div>

                <div className='mt-2 flex flex-wrap gap-2 text-xs text-slate-600'>
                  {selectedPet.breed ? (
                    <span className='rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700'>
                      {selectedPet.breed}
                    </span>
                  ) : null}
                  <span className='rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-800'>
                    {usageLabel}
                  </span>
                </div>

                <p className='mt-3 text-sm leading-7 text-slate-600'>
                  Updated {formatDateLabel(selectedPet.updated_at)}
                </p>
              </div>
            </div>
          </section>

          <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                  Pet Switcher
                </div>
                <h3 className='mt-1 text-lg font-black text-slate-900'>Choose a pet</h3>
              </div>
              <Link href='/create-pet' className='text-sm font-bold text-orange-700 hover:underline'>
                + New
              </Link>
            </div>

            <div className='mt-4 grid gap-3'>
              {pets.map((pet) => {
                const active = pet.id === selectedPet.id;

                return (
                  <Link
                    key={pet.id}
                    href={`/chat?pet_id=${encodeURIComponent(pet.id)}`}
                    className={[
                      'rounded-[22px] border px-4 py-3 transition',
                      active
                        ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='truncate text-sm font-black text-slate-900'>{pet.name}</div>
                        <div className='mt-1 truncate text-xs text-slate-500'>
                          {pet.breed || 'Pet profile'}
                        </div>
                      </div>

                      {active ? (
                        <span className='rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-bold text-white'>
                          Active
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm'>
            <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
              Quick Snapshot
            </div>
            <h3 className='mt-1 text-lg font-black text-slate-900'>Companionship summary</h3>

            <div className='mt-4 rounded-[22px] bg-gradient-to-r from-amber-50 to-rose-50 px-4 py-4 text-sm leading-7 text-slate-700'>
              {summaryText}
            </div>

            {recentMemories.length ? (
              <div className='mt-4 flex flex-wrap gap-2'>
                {recentMemories.slice(0, 4).map((memory) => (
                  <span
                    key={memory.id}
                    className='rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-orange-900'
                    title={memory.content}
                  >
                    {buildCompactTypeLabel(memory.memory_type)}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        </aside>

        <main className='min-w-0 space-y-5'>
          <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm'>
            <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
              <div>
                <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                  Conversation Area
                </div>
                <h2 className='mt-1 text-2xl font-black text-slate-900'>
                  Focused chat layout
                </h2>
              </div>

              <div className='flex flex-wrap gap-2 text-xs text-slate-600'>
                <span className='rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700'>
                  Space prioritized for messages
                </span>
                <span className='rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700'>
                  Summary folded by default
                </span>
              </div>
            </div>

            <details className='mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3'>
              <summary className='cursor-pointer list-none select-none'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <div className='text-sm font-bold text-slate-900'>Companionship summary</div>
                    <div className='mt-1 text-xs text-slate-500'>
                      Expand only when you need the longer context
                    </div>
                  </div>
                  <span className='rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-700'>
                    Expand
                  </span>
                </div>
              </summary>

              <div className='mt-4 border-t border-slate-200 pt-4 text-sm leading-7 text-slate-700'>
                {summaryText}
              </div>
            </details>
          </section>

          <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm'>
            <ChatPlayground
              petId={selectedPet.id}
              initialMessages={initialMessages}
              initialRemainingLabel={usageLabel}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
