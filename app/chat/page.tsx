import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChatPlayground } from '@/components/chat-playground';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { getChatAccessStatus } from '@/lib/chat-access';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

type SearchParamsShape = {
  pet_id?: string | string[];
};

type ChatPageProps = {
  searchParams?: Promise<SearchParamsShape> | SearchParamsShape;
};

type ChatMessageRow = {
  id: string;
  role: string;
  content: string;
  created_at: string | null;
};

type MemoryRow = {
  id: string;
  content: string;
  type: string | null;
  importance: number | null;
  updated_at: string | null;
};

type MemorySummaryRow = {
  pet_id: string;
  summary: string;
  memory_count: number | null;
  updated_at: string | null;
};

type PetOverview = Awaited<ReturnType<typeof getPetsForUser>>;
type PetItem = PetOverview['pets'][number];

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
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

function buildFallbackGreeting(pet: PetItem) {
  return `*blinks slowly* Hi, I'm ${pet.name}. I'm here with you. Tell me what's on your mind, and let's chat for a while.`;
}

function buildMemoryTypeLabel(value: string | null | undefined) {
  if (!value) return 'Memory';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildCompanionshipSummary(
  pet: PetItem,
  summaryRow: MemorySummaryRow | null,
  memories: MemoryRow[],
) {
  const summaryText = summaryRow?.summary?.trim();

  if (summaryText) {
    return summaryText;
  }

  const clues = memories
    .map((item) => item.content?.trim())
    .filter(Boolean)
    .slice(0, 3) as string[];

  if (!clues.length) {
    return `${pet.name} is ready to chat. As you talk more, this summary will grow into a clearer companionship snapshot.`;
  }

  return `${pet.name}'s recent companionship clues: ${clues.join(' ')}`;
}

function PetAvatar({
  name,
  imageUrl,
  size = 'md',
}: {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClass =
    size === 'sm'
      ? 'h-11 w-11 rounded-2xl text-lg'
      : size === 'md'
        ? 'h-14 w-14 rounded-[20px] text-2xl'
        : size === 'lg'
          ? 'h-20 w-20 rounded-[22px] text-3xl'
          : 'h-16 w-16 rounded-[20px] text-2xl';

  if (imageUrl) {
    return (
      <div
        className={[
          'overflow-hidden border border-orange-100 bg-orange-50 shadow-sm',
          sizeClass,
        ].join(' ')}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${name} avatar`}
          className='h-full w-full object-cover'
        />
      </div>
    );
  }

  return (
    <div
      className={[
        'flex items-center justify-center border border-orange-100 bg-orange-100 text-orange-900 shadow-sm',
        sizeClass,
      ].join(' ')}
      aria-label={`${name} avatar placeholder`}
    >
      🐾
    </div>
  );
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const requestedPetId = pickFirst(resolvedSearchParams?.pet_id).trim();

  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please+configure+Supabase+first.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    redirect('/login?error=Unable+to+verify+your+session.+Please+sign+in+again.');
  }

  if (!user) {
    redirect('/login?message=Please+log+in+to+continue.');
  }

  const [petOverview, usageResult] = await Promise.all([
    getPetsForUser(user.id).catch(() => ({ pets: [], defaultPetId: null })),
    getChatAccessStatus(user.id).catch(() => null),
  ]);

  const pets = petOverview?.pets ?? [];
  const defaultPetId = petOverview?.defaultPetId ?? null;

  if (!pets.length) {
    return (
      <>
        <div className='mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-8 pb-24 sm:px-6 lg:px-8'>
          <div className='w-full rounded-[32px] border border-orange-100 bg-white p-6 shadow-sm sm:p-8'>
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

        <MobileBottomNav />
      </>
    );
  }

  const selectedPet =
    pets.find((pet) => pet.id === requestedPetId) ??
    pets.find((pet) => pet.id === defaultPetId) ??
    pets[0];

  const [{ data: messagesData }, { data: memoriesData }, { data: summaryData }] =
    await Promise.all([
      supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('user_id', user.id)
        .eq('pet_id', selectedPet.id)
        .order('created_at', { ascending: true })
        .limit(100),
      supabase
        .from('memories')
        .select('id, content, type, importance, updated_at')
        .eq('user_id', user.id)
        .eq('pet_id', selectedPet.id)
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(6),
      supabase
        .from('memory_summaries')
        .select('pet_id, summary, memory_count, updated_at')
        .eq('user_id', user.id)
        .eq('pet_id', selectedPet.id)
        .maybeSingle(),
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
  const memorySummary = (summaryData as MemorySummaryRow | null) ?? null;
  const summaryText = buildCompanionshipSummary(selectedPet, memorySummary, recentMemories);

  const usageLabel = formatUsageLabel(
    usageResult ?? {
      vip: false,
      remaining: 20,
      limit: 20,
    },
  );

  return (
    <>
      <div className='mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6 sm:py-6 lg:px-8'>
        {/* Mobile-first compact hero */}
        <section className='mb-4 rounded-[26px] border border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 p-4 shadow-sm sm:mb-6 sm:rounded-[30px] sm:p-6'>
          <div className='text-[11px] font-bold uppercase tracking-[0.2em] text-orange-700 sm:text-xs'>
            Chat with Pet
          </div>

          <div className='mt-3 flex items-start gap-3 sm:gap-4'>
            <PetAvatar
              name={selectedPet.name}
              imageUrl={selectedPet.image_url}
              size='xl'
            />

            <div className='min-w-0 flex-1'>
              <h1 className='text-[1.9rem] font-black leading-tight tracking-tight text-slate-900 sm:text-3xl'>
                Chat with {selectedPet.name}
              </h1>

              <p className='mt-2 text-sm leading-7 text-slate-600 max-sm:hidden'>
                This layout gives more space to the conversation itself, while keeping summaries and
                memory shortcuts available without overwhelming the chat stream.
              </p>

              <div className='mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap'>
                <Link
                  href={`/memories?pet_id=${encodeURIComponent(selectedPet.id)}`}
                  className='inline-flex items-center justify-center rounded-full border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-orange-900 transition hover:bg-orange-50'
                >
                  Memories
                </Link>
                <Link
                  href='/pets'
                  className='inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50'
                >
                  Manage Pets
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className='grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-stretch xl:gap-6'>
          {/* Main chat first on mobile */}
          <main className='order-1 min-w-0 space-y-4 xl:order-2 xl:flex xl:min-h-[calc(100vh-190px)] xl:flex-col xl:space-y-5'>
            {/* Desktop-only explainer */}
            <section className='hidden rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm xl:block xl:shrink-0'>
              <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                <div>
                  <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                    Conversation Area
                  </div>
                  <h2 className='mt-1 text-2xl font-black text-slate-900'>Focused chat layout</h2>
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

            <section className='rounded-[24px] border border-orange-100 bg-white p-3 shadow-sm sm:rounded-[28px] sm:p-5 xl:min-h-0 xl:flex xl:flex-1 xl:flex-col'>
              <ChatPlayground
                key={selectedPet.id}
                petId={selectedPet.id}
                petName={selectedPet.name}
                petImageUrl={selectedPet.image_url}
                initialMessages={initialMessages}
                initialRemainingLabel={usageLabel}
                initialMemorySummary={summaryText}
              />
            </section>
          </main>

          {/* Secondary info after chat on mobile */}
          <aside className='order-2 space-y-4 xl:order-1 xl:space-y-5'>
            <section className='rounded-[24px] border border-orange-100 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5'>
              <div className='flex items-start gap-4'>
                <PetAvatar
                  name={selectedPet.name}
                  imageUrl={selectedPet.image_url}
                  size='lg'
                />

                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h2 className='truncate text-xl font-black text-slate-900'>{selectedPet.name}</h2>

                    {selectedPet.id === defaultPetId ? (
                      <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700'>
                        Primary
                      </span>
                    ) : null}
                  </div>

                  <div className='mt-2 flex flex-wrap gap-2 text-xs text-slate-600'>
                    <span className='rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-800'>
                      {usageLabel}
                    </span>
                    <span className='rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700'>
                      {memorySummary?.memory_count ?? recentMemories.length} memories
                    </span>
                  </div>

                  <p className='mt-3 text-sm leading-7 text-slate-600'>
                    Memory updated{' '}
                    {formatDateLabel(memorySummary?.updated_at ?? recentMemories[0]?.updated_at ?? null)}
                  </p>
                </div>
              </div>
            </section>

            <section className='rounded-[24px] border border-orange-100 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                    Pet Switcher
                  </div>
                  <h3 className='mt-1 text-lg font-black text-slate-900'>Choose a pet</h3>
                </div>

                <Link href='/pets' className='text-sm font-bold text-orange-700 hover:underline'>
                  Manage
                </Link>
              </div>

              <div className='mt-4 grid gap-3'>
                {pets.map((pet) => {
                  const isActive = pet.id === selectedPet.id;

                  return (
                    <Link
                      key={pet.id}
                      href={`/chat?pet_id=${encodeURIComponent(pet.id)}`}
                      className={[
                        'rounded-[20px] border px-4 py-3 transition sm:rounded-[22px]',
                        isActive
                          ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <div className='flex min-w-0 items-center gap-3'>
                          <PetAvatar name={pet.name} imageUrl={pet.image_url} size='sm' />

                          <div className='min-w-0'>
                            <div className='truncate text-sm font-black text-slate-900'>{pet.name}</div>
                            <div className='mt-1 truncate text-xs text-slate-500'>
                              {pet.id === defaultPetId ? 'Primary pet' : 'Available for chat'}
                            </div>
                          </div>
                        </div>

                        {isActive ? (
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

            <section className='rounded-[24px] border border-orange-100 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5'>
              <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                Quick Snapshot
              </div>
              <h3 className='mt-1 text-lg font-black text-slate-900'>Companionship summary</h3>

              <div className='mt-4 rounded-[20px] bg-gradient-to-r from-amber-50 to-rose-50 px-4 py-4 text-sm leading-7 text-slate-700 sm:rounded-[22px]'>
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
                      {buildMemoryTypeLabel(memory.type)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className='mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                  No saved memories yet. Keep chatting and this panel will grow.
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
