import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { SiteHeader } from '@/components/site-header';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

type SearchParamsShape = {
  pet_id?: string | string[];
  petId?: string | string[];
  q?: string | string[];
  type?: string | string[];
  priority?: string | string[];
  sort?: string | string[];
  expand?: string | string[];
};

type MemoriesPageProps = {
  searchParams?: Promise<SearchParamsShape> | SearchParamsShape;
};

type MemoryRow = {
  id: string;
  pet_id: string | null;
  content: string;
  type: string | null;
  importance: number | null;
  created_at: string | null;
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

function buildTypeLabel(value: string | null | undefined) {
  if (!value) return 'Memory';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function clampPriority(value: number | null | undefined) {
  return Math.max(1, Math.min(5, value ?? 1));
}

function buildPriorityLabel(importance: number | null) {
  return `Priority ${clampPriority(importance)}`;
}

function buildPriorityTone(importance: number | null) {
  const value = clampPriority(importance);
  if (value >= 5) return 'bg-[rgba(251,113,133,0.12)] text-rose-100 border-[rgba(251,113,133,0.24)]';
  if (value === 4) return 'bg-[rgba(245,158,11,0.12)] text-amber-100 border-[rgba(255,184,107,0.26)]';
  if (value === 3) return 'bg-[rgba(96,165,250,0.12)] text-sky-100 border-[rgba(96,165,250,0.24)]';
  return 'bg-white/5 text-stone-200 border-white/10';
}

function formatDateLabel(value: string | null) {
  if (!value) return 'Recently updated';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'Recently updated';
  }
}

function buildExcerpt(value: string, maxLength = 140) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}…`;
}

function buildSummaryFromPetAndMemories(
  pet: PetItem | null,
  memories: MemoryRow[],
  summaryText?: string | null
) {
  const normalizedSummary = summaryText?.trim();

  if (normalizedSummary) {
    return normalizedSummary;
  }

  if (!pet) {
    if (!memories.length) {
      return 'No memory content yet. As chats accumulate, this page can become a searchable memory workspace for habits, emotional clues, and preferences.';
    }

    return `You currently have ${memories.length} memory entries across your account. Use search, type, priority, and sort controls to keep the list manageable as it grows.`;
  }

  const clues = memories
    .map((item) => item.content?.trim())
    .filter(Boolean)
    .slice(0, 3) as string[];

  if (!clues.length) {
    return `${pet.name} does not have saved memories yet. Keep chatting and new companionship clues will start appearing here.`;
  }

  return `${pet.name}'s recent memory clues: ${clues.join(' ')}`;
}

function buildMemoriesHref(params: {
  petId?: string;
  q?: string;
  type?: string;
  priority?: string;
  sort?: string;
  expand?: string;
}) {
  const search = new URLSearchParams();

  if (params.petId) search.set('pet_id', params.petId);
  if (params.q) search.set('q', params.q);
  if (params.type) search.set('type', params.type);
  if (params.priority) search.set('priority', params.priority);
  if (params.sort) search.set('sort', params.sort);
  if (params.expand) search.set('expand', params.expand);

  const query = search.toString();
  return query ? `/memories?${query}` : '/memories';
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
      : size === 'lg'
        ? 'h-20 w-20 rounded-[22px] text-3xl'
        : size === 'xl'
          ? 'h-16 w-16 rounded-[20px] text-2xl'
          : 'h-14 w-14 rounded-[20px] text-2xl';

  if (imageUrl) {
    return (
      <div
        className={[
          'shrink-0 overflow-hidden border border-white/10 bg-white/5 shadow-[0_8px_22px_rgba(0,0,0,0.22)]',
          sizeClass,
        ].join(' ')}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`${name} avatar`} className='h-full w-full object-cover' />
      </div>
    );
  }

  return (
    <div
      className={[
        'shrink-0 flex items-center justify-center border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-[var(--noir-text-soft,#f2dbc0)] shadow-[0_8px_22px_rgba(0,0,0,0.22)]',
        sizeClass,
      ].join(' ')}
      aria-label={`${name} avatar placeholder`}
    >
      🐾
    </div>
  );
}

export default async function MemoriesPage({ searchParams }: MemoriesPageProps) {
  async function deleteMemoryAction(formData: FormData) {
    'use server';

    if (!hasSupabaseEnv()) {
      redirect('/memories?error=Please+configure+Supabase+first.');
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login?message=Please+sign+in+first+to+manage+memories.');
    }

    const memoryId = String(formData.get('memoryId') || '').trim();
    const returnTo = String(formData.get('returnTo') || '/memories').trim();

    if (!memoryId) {
      redirect(returnTo || '/memories');
    }

    await supabase.from('memories').delete().eq('id', memoryId).eq('user_id', user.id);

    revalidatePath('/memories');
    revalidatePath('/chat');
    revalidatePath('/pets');
    redirect(returnTo || '/memories');
  }

  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;

  const selectedPetId = pickFirst(
    resolvedSearchParams?.pet_id ?? resolvedSearchParams?.petId
  ).trim();
  const q = pickFirst(resolvedSearchParams?.q).trim();
  const type = pickFirst(resolvedSearchParams?.type).trim() || 'all';
  const priority = pickFirst(resolvedSearchParams?.priority).trim() || 'all';
  const sort = pickFirst(resolvedSearchParams?.sort).trim() || 'latest';
  const expand = pickFirst(resolvedSearchParams?.expand).trim();

  if (!hasSupabaseEnv()) {
    redirect('/login?message=Please+configure+Supabase+first.');
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
    redirect('/login?message=Please+sign+in+first+to+open+memories.');
  }

  const petOverview = await getPetsForUser(user.id).catch(() => ({
    pets: [],
    defaultPetId: null,
  }));

  const pets = petOverview?.pets ?? [];
  const defaultPetId = petOverview?.defaultPetId ?? null;

  if (!pets.length) {
    return (
      <div className='app-brand-backdrop page-noir min-h-screen'>
        <div className='hidden md:block'>
          <SiteHeader theme='dark' />
        </div>

        <div className='mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8'>
          <div className='noir-hero w-full rounded-[32px] p-8'>
            <div className='text-sm font-bold uppercase tracking-[0.18em] text-[var(--noir-text-muted,#9f8c7d)]'>
              Memories
            </div>
            <h1 className='mt-3 text-3xl font-black tracking-tight text-white'>
              Create a pet before you manage memories
            </h1>
            <p className='mt-3 max-w-2xl text-sm leading-7 text-[var(--noir-text-soft,#d7c0a7)]'>
              The memory page is ready, but there is no pet profile yet. Create a pet first so
              conversations can turn into searchable memory entries.
            </p>

            <div className='mt-6 flex flex-wrap gap-3'>
              <Link href='/create-pet' className='brand-button'>
                Create Pet
              </Link>
              <Link href='/chat' className='subtle-button'>
                Back to Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const firstPet = pets[0];
  const selectedPet =
    pets.find((pet) => pet.id === selectedPetId) ??
    pets.find((pet) => pet.id === defaultPetId) ??
    firstPet;

  if (!selectedPet) {
    redirect('/create-pet');
  }

  const [{ data: memoriesData }, { data: summaryData }] = await Promise.all([
    supabase
      .from('memories')
      .select('id, pet_id, type, content, importance, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('pet_id', selectedPet.id)
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(500),
    supabase
      .from('memory_summaries')
      .select('pet_id, summary, memory_count, updated_at')
      .eq('user_id', user.id)
      .eq('pet_id', selectedPet.id)
      .maybeSingle(),
  ]);

  const allMemories = (memoriesData ?? []) as MemoryRow[];
  const summaryRow = (summaryData as MemorySummaryRow | null) ?? null;

  let filteredMemories = allMemories.filter((item) => {
    if (q) {
      const haystack = `${item.content} ${item.type ?? ''}`.toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }

    if (type !== 'all' && (item.type ?? '') !== type) {
      return false;
    }

    const itemPriority = clampPriority(item.importance);

    if (priority !== 'all' && itemPriority !== Number(priority)) {
      return false;
    }

    return true;
  });

  filteredMemories = [...filteredMemories].sort((a, b) => {
    if (sort === 'highest_priority') {
      return (
        clampPriority(b.importance) - clampPriority(a.importance) ||
        new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
      );
    }

    if (sort === 'oldest') {
      return new Date(a.updated_at ?? 0).getTime() - new Date(b.updated_at ?? 0).getTime();
    }

    if (sort === 'type') {
      return buildTypeLabel(a.type).localeCompare(buildTypeLabel(b.type));
    }

    return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
  });

  const availableTypes = Array.from(
    new Set(allMemories.map((item) => item.type).filter(Boolean) as string[])
  ).sort();

  const openAll = expand === 'all';

  const returnTo = buildMemoriesHref({
    petId: selectedPet.id,
    q,
    type: type !== 'all' ? type : '',
    priority: priority !== 'all' ? priority : '',
    sort: sort !== 'latest' ? sort : '',
    expand,
  });

  const headerMemoryCount = summaryRow?.memory_count ?? allMemories.length;
  const headerUpdatedAt = summaryRow?.updated_at ?? allMemories[0]?.updated_at ?? null;
  const companionSummary = buildSummaryFromPetAndMemories(
    selectedPet,
    allMemories,
    summaryRow?.summary ?? null
  );

  return (
    <div className='app-brand-backdrop page-noir min-h-screen'>
      <div className='hidden md:block'>
        <SiteHeader theme='dark' />
      </div>

      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='noir-hero mb-6 rounded-[32px] p-6'>
          <div className='noir-pill px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em]'>
            🧠 Companion Memory Space
          </div>

          <div className='mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div className='flex items-start gap-4 sm:items-center'>
              <PetAvatar name={selectedPet.name} imageUrl={selectedPet.image_url} size='xl' />

              <div className='min-w-0'>
                <h1 className='text-[clamp(2rem,3vw,2.8rem)] font-black tracking-[-0.04em] text-white'>
                  Memories of {selectedPet.name}
                </h1>
                <p className='mt-2 max-w-3xl text-sm leading-7 text-[var(--noir-text-soft,#d7c0a7)]'>
                  Searchable memories, cleaner filters, and a softer dark shell so the page feels
                  like a natural continuation of Chat, Pets, and Account.
                </p>
              </div>
            </div>

            <div className='hidden md:flex flex-wrap gap-3'>
              <Link
                href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`}
                className='subtle-button !h-11 text-sm'
              >
                Back to Chat
              </Link>
              <Link href='/pets' className='subtle-button !h-11 text-sm'>
                Manage Pets
              </Link>
            </div>
          </div>
        </div>

        <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
          <aside className='space-y-5'>
            <section className='noir-panel rounded-[28px] p-5'>
              <div className='flex items-start gap-4'>
                <PetAvatar name={selectedPet.name} imageUrl={selectedPet.image_url} size='lg' />

                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h2 className='truncate text-xl font-black text-white'>{selectedPet.name}</h2>

                    {selectedPet.id === defaultPetId ? (
                      <span className='rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-bold text-[var(--noir-text-soft,#ead6bf)]'>
                        Primary
                      </span>
                    ) : null}
                  </div>

                  <div className='mt-2 flex flex-wrap gap-2 text-xs text-[var(--noir-text-soft,#d7c0a7)]'>
                    <span className='rounded-full border border-[#e5a962]/20 bg-[rgba(229,169,98,0.12)] px-2.5 py-1 font-semibold text-[#f3d09b]'>
                      {headerMemoryCount} memories
                    </span>
                  </div>

                  <p className='mt-3 text-sm leading-7 text-[var(--noir-text-muted,#9f8c7d)]'>
                    Updated {formatDateLabel(headerUpdatedAt)}
                  </p>
                </div>
              </div>
            </section>

            <section className='noir-panel rounded-[28px] p-5'>
              <div className='text-xs font-bold uppercase tracking-[0.18em] text-[var(--noir-text-muted,#9f8c7d)]'>
                Pet Switcher
              </div>
              <h3 className='mt-1 text-lg font-black text-white'>Memory scope</h3>

              <div className='mt-4 space-y-2'>
                {pets.map((pet) => {
                  const active = pet.id === selectedPet.id;

                  const petHref = buildMemoriesHref({
                    petId: pet.id,
                    q,
                    type: type !== 'all' ? type : '',
                    priority: priority !== 'all' ? priority : '',
                    sort: sort !== 'latest' ? sort : '',
                    expand,
                  });

                  return (
                    <Link
                      key={pet.id}
                      href={petHref}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                        active
                          ? 'border-white/20 bg-[rgba(255,255,255,0.10)] shadow-[0_10px_24px_rgba(0,0,0,0.22)]'
                          : 'border-white/10 bg-white/5 hover:bg-white/8'
                      }`}
                    >
                      <PetAvatar name={pet.name} imageUrl={pet.image_url} size='sm' />
                      <div className='min-w-0 flex-1'>
                        <div className={`truncate font-bold ${active ? 'text-white' : 'text-[var(--noir-text-soft,#ead6bf)]'}`}>
                          {pet.name}
                        </div>
                        <div className='text-xs text-[var(--noir-text-muted,#9f8c7d)]'>
                          {pet.id === defaultPetId ? 'Primary pet' : 'Companion'}
                        </div>
                      </div>

                      {active ? (
                        <span className='inline-flex items-center rounded-full border border-[#e5a962]/25 bg-[rgba(229,169,98,0.12)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#f6d19b]'>
                          Live
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className='noir-panel rounded-[28px] p-5'>
              <div className='text-xs font-bold uppercase tracking-[0.18em] text-[var(--noir-text-muted,#9f8c7d)]'>
                Companion Snapshot
              </div>
              <p className='mt-3 text-sm leading-7 text-[var(--noir-text-soft,#d7c0a7)]'>
                {companionSummary}
              </p>
            </section>
          </aside>

          <main className='min-w-0 xl:flex xl:min-h-[calc(100vh-250px)] xl:flex-col'>
            <section className='noir-panel rounded-[28px] p-5'>
              <form className='grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.82fr))_minmax(0,1.08fr)]'>
                <input type='hidden' name='pet_id' value={selectedPet.id} />

                <label className='grid gap-2'>
                  <span className='text-xs font-bold uppercase tracking-[0.16em] text-[var(--noir-text-muted,#9f8c7d)]'>
                    Search
                  </span>
                  <input
                    name='q'
                    defaultValue={q}
                    placeholder='Search memory text'
                    className='noir-field h-11 rounded-2xl px-4 text-sm outline-none transition'
                  />
                </label>

                <label className='grid gap-2'>
                  <span className='text-xs font-bold uppercase tracking-[0.16em] text-[var(--noir-text-muted,#9f8c7d)]'>
                    Type
                  </span>
                  <select
                    name='type'
                    defaultValue={type}
                    className='noir-field h-11 rounded-2xl px-4 text-sm outline-none transition'
                  >
                    <option value='all'>All types</option>
                    {availableTypes.map((item) => (
                      <option key={item} value={item}>
                        {buildTypeLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className='grid gap-2'>
                  <span className='text-xs font-bold uppercase tracking-[0.16em] text-[var(--noir-text-muted,#9f8c7d)]'>
                    Priority
                  </span>
                  <select
                    name='priority'
                    defaultValue={priority}
                    className='noir-field h-11 rounded-2xl px-4 text-sm outline-none transition'
                  >
                    <option value='all'>All priorities</option>
                    <option value='5'>Priority 5</option>
                    <option value='4'>Priority 4</option>
                    <option value='3'>Priority 3</option>
                    <option value='2'>Priority 2</option>
                    <option value='1'>Priority 1</option>
                  </select>
                </label>

                <label className='grid gap-2'>
                  <span className='text-xs font-bold uppercase tracking-[0.16em] text-[var(--noir-text-muted,#9f8c7d)]'>
                    Sort
                  </span>
                  <select
                    name='sort'
                    defaultValue={sort}
                    className='noir-field h-11 rounded-2xl px-4 text-sm outline-none transition'
                  >
                    <option value='latest'>Latest</option>
                    <option value='oldest'>Oldest</option>
                    <option value='highest_priority'>Highest priority</option>
                    <option value='type'>Type</option>
                  </select>
                </label>

                <div className='grid min-w-0 gap-2'>
                  <span className='text-xs font-bold uppercase tracking-[0.16em] text-[var(--noir-text-muted,#9f8c7d)]'>
                    Actions
                  </span>
                  <div className='flex min-w-0 flex-col gap-2 2xl:flex-row'>
                    <button type='submit' className='brand-button !h-11 w-full min-w-0 2xl:flex-1'>
                      Apply
                    </button>
                    <Link
                      href={`/memories?pet_id=${encodeURIComponent(selectedPet.id)}`}
                      className='subtle-button !h-11 w-full min-w-0 text-center 2xl:flex-1'
                    >
                      Reset
                    </Link>
                  </div>
                </div>
              </form>

              <div className='mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--noir-text-muted,#9f8c7d)]'>
                <span>{filteredMemories.length} result(s)</span>

                {openAll ? (
                  <Link
                    href={buildMemoriesHref({ petId: selectedPet.id, q, type, priority, sort })}
                    className='font-semibold text-[#f3d09b]'
                  >
                    Collapse all
                  </Link>
                ) : (
                  <Link
                    href={buildMemoriesHref({
                      petId: selectedPet.id,
                      q,
                      type: type !== 'all' ? type : '',
                      priority: priority !== 'all' ? priority : '',
                      sort: sort !== 'latest' ? sort : '',
                      expand: 'all',
                    })}
                    className='font-semibold text-[#f3d09b]'
                  >
                    Expand all
                  </Link>
                )}
              </div>
            </section>

            <section className='memories-scroll-panel mt-5 space-y-4'>
              {!filteredMemories.length ? (
                <div className='noir-empty rounded-[28px] px-6 py-10 text-center text-sm shadow-sm'>
                  No memories match the current filters.
                </div>
              ) : (
                filteredMemories.map((memory) => {
                  const isOpen = openAll;

                  return (
                    <details
                      key={memory.id}
                      open={isOpen}
                      className='noir-details-card group rounded-[28px] p-5'
                    >
                      <summary className='cursor-pointer list-none'>
                        <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                          <div className='min-w-0'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <span className='rounded-full border border-[#e5a962]/20 bg-[rgba(229,169,98,0.12)] px-2.5 py-1 text-[11px] font-bold text-[#f3d09b]'>
                                {buildTypeLabel(memory.type)}
                              </span>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${buildPriorityTone(
                                  memory.importance
                                )}`}
                              >
                                {buildPriorityLabel(memory.importance)}
                              </span>
                              {memory.pet_id === defaultPetId ? (
                                <span className='rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-bold text-[var(--noir-text-soft,#ead6bf)]'>
                                  Primary pet
                                </span>
                              ) : null}
                            </div>

                            <p className='mt-3 text-sm leading-7 text-[var(--noir-text-soft,#e6d3c0)]'>
                              {buildExcerpt(memory.content)}
                            </p>
                          </div>

                          <div className='text-xs text-[var(--noir-text-muted,#9f8c7d)]'>
                            Updated {formatDateLabel(memory.updated_at ?? memory.created_at)}
                          </div>
                        </div>
                      </summary>

                      <div className='mt-4 border-t border-white/10 pt-4'>
                        <div className='whitespace-pre-wrap text-sm leading-8 text-[var(--noir-text-soft,#e6d3c0)]'>
                          {memory.content}
                        </div>

                        <div className='mt-5 flex flex-wrap items-center justify-between gap-3'>
                          <div className='text-xs text-[var(--noir-text-muted,#9f8c7d)]'>
                            Created {formatDateLabel(memory.created_at)} · Updated{' '}
                            {formatDateLabel(memory.updated_at)}
                          </div>

                          <form action={deleteMemoryAction}>
                            <input type='hidden' name='memoryId' value={memory.id} />
                            <input type='hidden' name='returnTo' value={returnTo} />
                            <button
                              type='submit'
                              className='noir-danger-button rounded-full px-4 py-2 text-sm font-bold transition'
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </div>
                    </details>
                  );
                })
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
