import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { SiteHeader } from '@/components/site-header';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

type SearchParamsShape = {
  pet_id?: string | string[];
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

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function clampPriority(value: number | null | undefined) {
  return Math.max(1, Math.min(5, value ?? 1));
}

function buildPriorityLabel(importance: number | null) {
  return `Priority ${clampPriority(importance)}`;
}

function buildPriorityTone(importance: number | null) {
  const value = clampPriority(importance);

  if (value >= 5) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (value === 4) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (value === 3) return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
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
  summaryText?: string | null,
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

function buildReturnTo(params: {
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

  const selectedPetId = pickFirst(resolvedSearchParams?.pet_id).trim();
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
      <>
        <div className='hidden md:block'>
          <SiteHeader />
        </div>

        <div className='mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8'>
          <div className='w-full rounded-[32px] border border-orange-100 bg-white p-8 shadow-sm'>
            <div className='text-sm font-bold uppercase tracking-[0.18em] text-orange-600'>
              Memories
            </div>
            <h1 className='mt-3 text-3xl font-black tracking-tight text-slate-900'>
              Create a pet before you manage memories
            </h1>
            <p className='mt-3 max-w-2xl text-sm leading-7 text-slate-600'>
              The memory page is ready, but there is no pet profile yet. Create a pet first so
              conversations can turn into searchable memory entries.
            </p>

            <div className='mt-6 flex flex-wrap gap-3'>
              <Link href='/create-pet' className='brand-button'>
                Create Pet
              </Link>
              <Link
                href='/chat'
                className='rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50'
              >
                Back to Chat
              </Link>
            </div>
          </div>
        </div>
      </>
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
    new Set(allMemories.map((item) => item.type).filter(Boolean) as string[]),
  ).sort();

  const openAll = expand === 'all';

  const returnTo = buildReturnTo({
    petId: selectedPet.id,
    q,
    type: type !== 'all' ? type : '',
    priority: priority !== 'all' ? priority : '',
    sort: sort !== 'latest' ? sort : '',
    expand,
  });

  const headerMemoryCount = summaryRow?.memory_count ?? allMemories.length;
  const headerUpdatedAt = summaryRow?.updated_at ?? allMemories[0]?.updated_at ?? null;

  return (
    <>
      <div className='hidden md:block'>
        <SiteHeader />
      </div>

      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mb-6 rounded-[30px] border border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 p-6 shadow-sm'>
          <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
            Memories
          </div>

          <div className='mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div className='flex items-center gap-4'>
              <PetAvatar
                name={selectedPet.name}
                imageUrl={selectedPet.image_url}
                size='xl'
              />

              <div>
                <h1 className='text-3xl font-black tracking-tight text-slate-900'>
                  Memories of {selectedPet.name}
                </h1>
                <p className='mt-2 max-w-3xl text-sm leading-7 text-slate-600'>
                  This workspace gives more room to searchable memories, while keeping summary,
                  filters, and pet switching close at hand so {selectedPet.name}&apos;s history stays
                  easy to scan on both desktop and mobile.
                </p>
              </div>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link
                href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`}
                className='rounded-full border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-orange-900 transition hover:bg-orange-50'
              >
                Back to Chat
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
                      {headerMemoryCount} memories
                    </span>
                  </div>

                  <p className='mt-3 text-sm leading-7 text-slate-600'>
                    Updated {formatDateLabel(headerUpdatedAt)}
                  </p>
                </div>
              </div>
            </section>

            <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm'>
              <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                Pet Switcher
              </div>
              <h3 className='mt-1 text-lg font-black text-slate-900'>Memory scope</h3>

              <div className='mt-4 grid gap-3'>
                {pets.map((pet) => {
                  const isActive = pet.id === selectedPet.id;

                  return (
                    <Link
                      key={pet.id}
                      href={`/memories?pet_id=${encodeURIComponent(pet.id)}`}
                      className={[
                        'rounded-[22px] border px-4 py-3 transition',
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
                              {pet.id === defaultPetId ? 'Primary pet' : 'Available scope'}
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

            <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm'>
              <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                Companion Snapshot
              </div>
              <h3 className='mt-1 text-lg font-black text-slate-900'>Summary panel</h3>

              <div className='mt-4 rounded-[22px] bg-gradient-to-r from-amber-50 to-rose-50 px-4 py-4 text-sm leading-7 text-slate-700'>
                {buildSummaryFromPetAndMemories(selectedPet, allMemories, summaryRow?.summary)}
              </div>

              <div className='mt-4 flex flex-wrap gap-2'>
                <span className='rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700'>
                  Compact rows by default
                </span>
                <span className='rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700'>
                  Expand row to view full content
                </span>
                <span className='rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700'>
                  Mobile stacks filters automatically
                </span>
              </div>
            </section>
          </aside>

          <main className='min-w-0 space-y-5 xl:flex xl:h-[calc(100vh-220px)] xl:min-h-0 xl:flex-col'>
            <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm xl:shrink-0'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                    Memory Toolbar
                  </div>
                  <h2 className='mt-1 text-2xl font-black text-slate-900'>
                    Search, filter, and sort
                  </h2>
                </div>

                <div className='flex flex-wrap gap-2'>
                  <Link
                    href={buildReturnTo({
                      petId: selectedPet.id,
                      q,
                      type: type !== 'all' ? type : '',
                      priority: priority !== 'all' ? priority : '',
                      sort: sort !== 'latest' ? sort : '',
                      expand: 'all',
                    })}
                    className='rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50'
                  >
                    Expand all
                  </Link>

                  <Link
                    href={buildReturnTo({
                      petId: selectedPet.id,
                      q,
                      type: type !== 'all' ? type : '',
                      priority: priority !== 'all' ? priority : '',
                      sort: sort !== 'latest' ? sort : '',
                    })}
                    className='rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50'
                  >
                    Compact default
                  </Link>
                </div>
              </div>

              <form action='/memories' method='get' className='mt-5 space-y-4'>
                <input type='hidden' name='pet_id' value={selectedPet.id} />

                <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]'>
                  <label className='grid min-w-0 gap-2'>
                    <span className='text-sm font-bold text-slate-800'>Search</span>
                    <input
                      name='q'
                      defaultValue={q}
                      placeholder='Search memories, habits, emotions, or preferences'
                      className='input-shell w-full'
                    />
                  </label>

                  <div className='flex flex-col justify-end gap-3 sm:flex-row'>
                    <button type='submit' className='brand-button whitespace-nowrap'>
                      Apply
                    </button>

                    <Link
                      href={`/memories?pet_id=${encodeURIComponent(selectedPet.id)}`}
                      className='inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50'
                    >
                      Reset view
                    </Link>
                  </div>
                </div>

                <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                  <label className='grid min-w-0 gap-2'>
                    <span className='text-sm font-bold text-slate-800'>Type</span>
                    <select name='type' defaultValue={type} className='input-shell w-full'>
                      <option value='all'>All types</option>
                      {availableTypes.map((item) => (
                        <option key={item} value={item}>
                          {buildTypeLabel(item)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className='grid min-w-0 gap-2'>
                    <span className='text-sm font-bold text-slate-800'>Priority</span>
                    <select name='priority' defaultValue={priority} className='input-shell w-full'>
                      <option value='all'>All priorities</option>
                      <option value='5'>Priority 5</option>
                      <option value='4'>Priority 4</option>
                      <option value='3'>Priority 3</option>
                      <option value='2'>Priority 2</option>
                      <option value='1'>Priority 1</option>
                    </select>
                  </label>

                  <label className='grid min-w-0 gap-2'>
                    <span className='text-sm font-bold text-slate-800'>Sort</span>
                    <select name='sort' defaultValue={sort} className='input-shell w-full'>
                      <option value='latest'>Latest updated</option>
                      <option value='highest_priority'>Highest priority</option>
                      <option value='oldest'>Oldest first</option>
                      <option value='type'>Type A–Z</option>
                    </select>
                  </label>
                </div>
              </form>

              <div className='mt-4 flex flex-wrap gap-2'>
                <span className='rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700'>
                  Compact rows by default
                </span>
                <span className='rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700'>
                  Expand row to view full content
                </span>
                <span className='rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700'>
                  Filters stack cleanly on mobile
                </span>
              </div>
            </section>

            <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm xl:min-h-0 xl:flex xl:flex-1 xl:flex-col'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                    Memory List
                  </div>
                  <h2 className='mt-1 text-2xl font-black text-slate-900'>
                    {filteredMemories.length} visible result{filteredMemories.length === 1 ? '' : 's'}
                  </h2>
                </div>

                <div className='flex flex-wrap gap-2 text-xs text-slate-600'>
                  <span className='rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700'>
                    Default: compact
                  </span>
                  <span className='rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700'>
                    Expand rule: click row
                  </span>
                </div>
              </div>

              <div className='mt-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1 xl:overscroll-contain'>
                {!allMemories.length ? (
                  <div className='rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center'>
                    <div className='text-lg font-black text-slate-900'>
                      No memories yet for {selectedPet.name}
                    </div>
                    <p className='mt-2 text-sm leading-7 text-slate-600'>
                      Start chatting with {selectedPet.name} and memory entries will appear here as the
                      companionship history grows.
                    </p>

                    <div className='mt-5 flex flex-wrap justify-center gap-3'>
                      <Link
                        href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`}
                        className='brand-button'
                      >
                        Go to Chat
                      </Link>
                      <Link
                        href='/pets'
                        className='rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50'
                      >
                        Manage Pets
                      </Link>
                    </div>
                  </div>
                ) : !filteredMemories.length ? (
                  <div className='rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center'>
                    <div className='text-lg font-black text-slate-900'>No memories match this view</div>
                    <p className='mt-2 text-sm leading-7 text-slate-600'>
                      Try a broader search, change the type or priority filter, or reset the view.
                    </p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {filteredMemories.map((memory) => {
                      const expandedByDefault = openAll;

                      return (
                        <details
                          key={memory.id}
                          open={expandedByDefault}
                          className='group rounded-[24px] border border-slate-200 bg-white transition open:border-orange-200 open:shadow-sm'
                        >
                          <summary className='list-none cursor-pointer px-4 py-4 sm:px-5'>
                            <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                              <div className='min-w-0 flex-1'>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <span className='rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-800'>
                                    {buildTypeLabel(memory.type)}
                                  </span>

                                  <span
                                    className={[
                                      'rounded-full border px-2.5 py-1 text-[11px] font-bold',
                                      buildPriorityTone(memory.importance),
                                    ].join(' ')}
                                  >
                                    {buildPriorityLabel(memory.importance)}
                                  </span>

                                  {selectedPet.id === defaultPetId ? (
                                    <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700'>
                                      Primary pet
                                    </span>
                                  ) : null}
                                </div>

                                <div className='mt-3 text-sm font-semibold leading-7 text-slate-900'>
                                  {buildExcerpt(memory.content)}
                                </div>

                                <div className='mt-3 text-xs text-slate-500'>
                                  Updated {formatDateLabel(memory.updated_at)}
                                </div>
                              </div>

                              <div className='flex items-center gap-2'>
                                <span className='rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700'>
                                  Click to expand
                                </span>
                              </div>
                            </div>
                          </summary>

                          <div className='border-t border-slate-200 px-4 py-4 sm:px-5'>
                            <div className='whitespace-pre-wrap break-words text-sm leading-7 text-slate-700'>
                              {memory.content}
                            </div>

                            <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
                              <div className='flex flex-wrap gap-2 text-xs text-slate-500'>
                                <span>Created {formatDateLabel(memory.created_at)}</span>
                                <span>•</span>
                                <span>Updated {formatDateLabel(memory.updated_at)}</span>
                              </div>

                              <form action={deleteMemoryAction}>
                                <input type='hidden' name='memoryId' value={memory.id} />
                                <input type='hidden' name='returnTo' value={returnTo} />
                                <button
                                  type='submit'
                                  className='rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50'
                                >
                                  Delete
                                </button>
                              </form>
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
