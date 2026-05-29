import { redirect } from 'next/navigation';
import {
  deleteMemoryAction,
  refreshMemorySummariesAction,
} from '@/app/actions/memories';
import {
  PetEmptyStateCard,
  PetNoticeBanner,
  PetPageHeroCard,
  PetToolbarCard,
} from '@/components/pet-cards';
import { PetSwitcher } from '@/components/pet-switcher';
import { PrimaryPetBadge } from '@/components/pet-ui-badges';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getMemoryManagerData } from '@/lib/memory-service';
import { getPetsForUser } from '@/lib/pets';
import {
  createServerSupabaseClient,
  hasSupabaseEnv,
} from '@/lib/supabase/server';

function formatDate(value: string | null) {
  if (!value) return 'Just now';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const typeLabel: Record<string, string> = {
  profile: 'Owner Profile',
  fact: 'Recent Events',
  emotion: 'Emotional Clues',
  preference: 'Interaction Preferences',
};

type SortValue =
  | 'latest'
  | 'oldest'
  | 'priority_desc'
  | 'priority_asc'
  | 'type'
  | 'pet';

function truncateText(text: string, max = 110) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function normalizeText(value: string | null | undefined) {
  return (value || '').trim().toLowerCase();
}

function matchesPriority(
  importance: number,
  priority: string | undefined,
) {
  if (!priority || priority === 'all') return true;
  if (priority === 'high') return importance >= 4;
  if (priority === 'medium') return importance === 3;
  if (priority === 'low') return importance <= 2;
  return true;
}

function buildChatHref(selectedPetId: string | null) {
  return selectedPetId
    ? `/chat?pet_id=${encodeURIComponent(selectedPetId)}`
    : '/chat';
}

function buildResetHref(selectedPetId: string | null) {
  return selectedPetId
    ? `/memories?pet_id=${encodeURIComponent(selectedPetId)}`
    : '/memories';
}

function buildMemoryViewHref(
  selectedPetId: string | null,
  params?: Record<string, string | null | undefined>,
) {
  const search = new URLSearchParams();

  if (selectedPetId) {
    search.set('pet_id', selectedPetId);
  }

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value && value.trim()) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `/memories?${query}` : '/memories';
}

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams?: {
    message?: string;
    error?: string;
    pet_id?: string;
    q?: string;
    type?: string;
    priority?: string;
    sort?: SortValue;
  };
}) {
  if (!hasSupabaseEnv()) {
    redirect(
      '/login?error=Please%20configure%20Supabase%20environment%20variables%20first.',
    );
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please%20sign%20in%20first%20to%20view%20memories.');
  }

  const selectedPetId = searchParams?.pet_id || null;
  const query = (searchParams?.q || '').trim();
  const typeFilter = searchParams?.type || 'all';
  const priorityFilter = searchParams?.priority || 'all';
  const sort = (searchParams?.sort || 'latest') as SortValue;

  const [data, petsData] = await Promise.all([
    getMemoryManagerData(user.id, selectedPetId),
    getPetsForUser(user.id),
  ]);

  const selectedPetName = data.selectedPet?.name || 'All Pets';
  const primaryPetId = petsData.defaultPetId;

  const petOrderMap = new Map(
    petsData.pets.map((pet, index) => [pet.id, index]),
  );

  const orderedSummaries = [...data.summaries].sort((a, b) => {
    const aIsSelected = selectedPetId && a.petId === selectedPetId ? 1 : 0;
    const bIsSelected = selectedPetId && b.petId === selectedPetId ? 1 : 0;

    if (aIsSelected !== bIsSelected) return bIsSelected - aIsSelected;

    const aIsPrimary = a.petId === primaryPetId ? 1 : 0;
    const bIsPrimary = b.petId === primaryPetId ? 1 : 0;

    if (aIsPrimary !== bIsPrimary) return bIsPrimary - aIsPrimary;

    return (petOrderMap.get(a.petId) ?? 999) - (petOrderMap.get(b.petId) ?? 999);
  });

  const searchedMemories = data.memories.filter((memory) => {
    const text = normalizeText(memory.content);
    const petName = normalizeText(memory.petName);
    const type = normalizeText(typeLabel[memory.type] || memory.type);
    const q = normalizeText(query);

    const queryMatch =
      !q ||
      text.includes(q) ||
      petName.includes(q) ||
      type.includes(q);

    const typeMatch =
      typeFilter === 'all' ? true : memory.type === typeFilter;

    const priorityMatch = matchesPriority(memory.importance, priorityFilter);

    return queryMatch && typeMatch && priorityMatch;
  });

  const filteredMemories = [...searchedMemories].sort((a, b) => {
    const orderA =
      a.petId && a.petId === selectedPetId
        ? -1
        : a.petId
        ? (petOrderMap.get(a.petId) ?? 998)
        : 999;

    const orderB =
      b.petId && b.petId === selectedPetId
        ? -1
        : b.petId
        ? (petOrderMap.get(b.petId) ?? 998)
        : 999;

    switch (sort) {
      case 'oldest':
        return (
          new Date(a.updatedAt || 0).getTime() -
          new Date(b.updatedAt || 0).getTime()
        );
      case 'priority_desc':
        if (b.importance !== a.importance) return b.importance - a.importance;
        return (
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
        );
      case 'priority_asc':
        if (a.importance !== b.importance) return a.importance - b.importance;
        return (
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
        );
      case 'type': {
        const typeA = typeLabel[a.type] || a.type;
        const typeB = typeLabel[b.type] || b.type;
        if (typeA !== typeB) return typeA.localeCompare(typeB);
        return (
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
        );
      }
      case 'pet':
        if (orderA !== orderB) return orderA - orderB;
        if (b.importance !== a.importance) return b.importance - a.importance;
        return (
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
        );
      case 'latest':
      default:
        if (orderA !== orderB) return orderA - orderB;
        if (b.importance !== a.importance) return b.importance - a.importance;
        return (
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
        );
    }
  });

  const memoryCount = data.memories.length;
  const filteredCount = filteredMemories.length;
  const summaryCount = data.summaries.length;
  const emotionCount = data.memories.filter((item) => item.type === 'emotion').length;
  const importantCount = data.memories.filter((item) => item.importance >= 4).length;

  const hasActiveFilters =
    Boolean(query) ||
    typeFilter !== 'all' ||
    priorityFilter !== 'all' ||
    sort !== 'latest';

  const backToChatHref = buildChatHref(selectedPetId);

  return (
    <>
      <SiteHeader ctaLabel='Back to Chat' ctaHref={backToChatHref} />

      <main className='container-shell py-10'>
        <PetPageHeroCard
          eyebrow='Memory Center'
          title='EchoPaws Memory Manager'
          description='Browse memory summaries and manage long-term memories with a denser, easier-to-scan layout. Use search, filters, and sorting to keep growing memory data easy to navigate.'
          notice={
            searchParams?.message || searchParams?.error ? (
              <>
                {searchParams?.message ? (
                  <PetNoticeBanner tone='success'>
                    {searchParams.message}
                  </PetNoticeBanner>
                ) : null}
                {searchParams?.error ? (
                  <PetNoticeBanner tone='error' className='mt-3'>
                    {searchParams.error}
                  </PetNoticeBanner>
                ) : null}
              </>
            ) : null
          }
        />

        {data.pets.length ? (
          <PetToolbarCard className='mt-8'>
            <PetSwitcher
              pets={petsData.pets.map((pet) => ({
                id: pet.id,
                name: pet.name,
                imageUrl: pet.image_url || null,
                isPrimary: pet.id === petsData.defaultPetId,
              }))}
              selectedPetId={selectedPetId}
              basePath='/memories'
              title='Switch Memory View'
              description='Primary pet stays prioritized. On smaller screens, summaries stack above the memory list to keep scanning easier.'
              includeAllOption
              allLabel='All Pets'
            />
          </PetToolbarCard>
        ) : null}

        {data.pets.length ? (
          <>
            <section className='mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              <div className='glass-card p-5'>
                <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-muted'>
                  Current View
                </div>
                <div className='mt-3 text-2xl font-extrabold tracking-tight'>
                  {selectedPetName}
                </div>
              </div>

              <div className='glass-card p-5'>
                <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-muted'>
                  Memories
                </div>
                <div className='mt-3 text-2xl font-extrabold tracking-tight'>
                  {filteredCount}
                  <span className='ml-2 text-sm font-medium text-muted'>
                    / {memoryCount}
                  </span>
                </div>
              </div>

              <div className='glass-card p-5'>
                <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-muted'>
                  Summaries
                </div>
                <div className='mt-3 text-2xl font-extrabold tracking-tight'>
                  {summaryCount}
                </div>
              </div>

              <div className='glass-card p-5'>
                <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-muted'>
                  Emotion / High Priority
                </div>
                <div className='mt-3 text-2xl font-extrabold tracking-tight'>
                  {emotionCount} / {importantCount}
                </div>
              </div>
            </section>

            <section className='mt-8 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]'>
              <aside className='space-y-5'>
                <div className='glass-card p-6'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                      <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
                        Companionship Summaries
                      </div>
                      <h2 className='mt-2 text-2xl font-extrabold'>
                        Summary Workspace
                      </h2>
                      <p className='mt-2 text-sm leading-7 text-muted'>
                        Default rule: current pet summary opens first. Other pets stay collapsed so the left column remains compact on both desktop and mobile.
                      </p>
                    </div>

                    <form action={refreshMemorySummariesAction}>
                      {selectedPetId ? (
                        <input type='hidden' name='petId' value={selectedPetId} />
                      ) : null}
                      <button className='subtle-button whitespace-nowrap'>
                        {selectedPetId
                          ? `Refresh ${selectedPetName} Summary`
                          : 'Refresh All Summaries'}
                      </button>
                    </form>
                  </div>

                  <div className='mt-5 grid gap-3'>
                    {orderedSummaries.length ? (
                      orderedSummaries.map((summary, index) => {
                        const shouldOpen =
                          orderedSummaries.length === 1 ||
                          summary.petId === selectedPetId ||
                          (!selectedPetId && summary.petId === primaryPetId) ||
                          index === 0;

                        return (
                          <details
                            key={summary.petId}
                            open={shouldOpen}
                            className='rounded-[24px] border border-black/5 bg-white p-4'
                          >
                            <summary className='cursor-pointer list-none'>
                              <div className='flex items-start gap-3'>
                                <div className='flex-1 min-w-0'>
                                  <div className='flex flex-wrap items-center gap-2'>
                                    <h3 className='text-base font-extrabold'>
                                      {summary.petName}
                                    </h3>
                                    <PrimaryPetBadge
                                      show={summary.petId === primaryPetId}
                                      size='md'
                                    />
                                  </div>

                                  <div className='mt-1 text-xs text-muted'>
                                    {summary.memoryCount} memories · Updated{' '}
                                    {formatDate(summary.updatedAt)}
                                  </div>

                                  <div className='mt-3 text-sm leading-7 text-muted'>
                                    {truncateText(summary.summary, shouldOpen ? 220 : 120)}
                                  </div>
                                </div>
                              </div>
                            </summary>

                            <div className='mt-4 border-t border-black/5 pt-4'>
                              <div className='rounded-2xl bg-orange-50 px-4 py-3 text-sm leading-8 text-ink'>
                                {summary.summary}
                              </div>

                              <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
                                <div className='text-xs text-muted'>
                                  Full summary for {summary.petName}
                                </div>
                                <a
                                  href={buildMemoryViewHref(summary.petId, {
                                    q: query || undefined,
                                    type: typeFilter !== 'all' ? typeFilter : undefined,
                                    priority:
                                      priorityFilter !== 'all'
                                        ? priorityFilter
                                        : undefined,
                                    sort: sort !== 'latest' ? sort : undefined,
                                  })}
                                  className='text-xs font-bold text-orange-700 hover:text-orange-900'
                                >
                                  Focus this pet →
                                </a>
                              </div>
                            </div>
                          </details>
                        );
                      })
                    ) : (
                      <PetEmptyStateCard
                        className='bg-white'
                        title='No memory summaries yet'
                        description='Go back to chat and interact for a few rounds — the system will auto-generate summaries.'
                        primaryAction={{
                          label: 'Back to Chat',
                          href: backToChatHref,
                        }}
                      />
                    )}
                  </div>
                </div>
              </aside>

              <section className='min-w-0'>
                <div className='glass-card p-6'>
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div>
                      <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
                        Memory List
                      </div>
                      <h2 className='mt-2 text-2xl font-extrabold'>
                        Compact Memory Manager
                      </h2>
                      <p className='mt-2 text-sm leading-7 text-muted'>
                        Default rule: memory rows stay compact and collapsed. Tap a row to expand full content, metadata, and delete action. On mobile, filters stack vertically for easier use.
                      </p>
                    </div>

                    <a
                      href={buildResetHref(selectedPetId)}
                      className='text-sm font-bold text-orange-700 hover:text-orange-900'
                    >
                      Reset view
                    </a>
                  </div>

                  <form
                    method='GET'
                    action='/memories'
                    className='mt-5 rounded-[24px] border border-black/5 bg-card-gradient p-4'
                  >
                    {selectedPetId ? (
                      <input type='hidden' name='pet_id' value={selectedPetId} />
                    ) : null}

                    <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,180px))_minmax(0,180px)]'>
                      <label className='grid gap-2 text-sm font-bold'>
                        Search
                        <input
                          name='q'
                          defaultValue={query}
                          placeholder='Search memories'
                          className='input-shell'
                        />
                      </label>

                      <label className='grid gap-2 text-sm font-bold'>
                        Type
                        <select
                          name='type'
                          defaultValue={typeFilter}
                          className='input-shell'
                        >
                          <option value='all'>All Types</option>
                          <option value='emotion'>Emotional Clues</option>
                          <option value='preference'>Interaction Preferences</option>
                          <option value='fact'>Recent Events</option>
                          <option value='profile'>Owner Profile</option>
                        </select>
                      </label>

                      <label className='grid gap-2 text-sm font-bold'>
                        Priority
                        <select
                          name='priority'
                          defaultValue={priorityFilter}
                          className='input-shell'
                        >
                          <option value='all'>All Priorities</option>
                          <option value='high'>High (4-5)</option>
                          <option value='medium'>Medium (3)</option>
                          <option value='low'>Low (1-2)</option>
                        </select>
                      </label>

                      <label className='grid gap-2 text-sm font-bold'>
                        Sort
                        <select
                          name='sort'
                          defaultValue={sort}
                          className='input-shell'
                        >
                          <option value='latest'>Latest Updated</option>
                          <option value='oldest'>Oldest First</option>
                          <option value='priority_desc'>Highest Priority</option>
                          <option value='priority_asc'>Lowest Priority</option>
                          <option value='type'>Group by Type</option>
                          <option value='pet'>Group by Pet</option>
                        </select>
                      </label>

                      <div className='flex items-end gap-3'>
                        <button className='brand-button w-full'>Apply</button>
                      </div>
                    </div>

                    <div className='mt-3 flex flex-wrap gap-2 text-xs text-muted'>
                      <span className='rounded-full bg-white px-3 py-1 ring-1 ring-black/5'>
                        Compact rows by default
                      </span>
                      <span className='rounded-full bg-white px-3 py-1 ring-1 ring-black/5'>
                        Expand row to view full content
                      </span>
                      <span className='rounded-full bg-white px-3 py-1 ring-1 ring-black/5'>
                        Mobile stacks filters automatically
                      </span>
                    </div>
                  </form>

                  <div className='mt-5 flex flex-wrap items-center justify-between gap-3'>
                    <div className='text-sm text-muted'>
                      Showing <strong>{filteredCount}</strong> of{' '}
                      <strong>{memoryCount}</strong> memories
                      {query ? (
                        <>
                          {' '}
                          for <span className='font-bold text-ink'>“{query}”</span>
                        </>
                      ) : null}
                    </div>

                    {hasActiveFilters ? (
                      <a
                        href={buildResetHref(selectedPetId)}
                        className='rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold text-ink transition hover:bg-stone-50'
                      >
                        Clear filters
                      </a>
                    ) : null}
                  </div>

                  <div className='mt-5 grid gap-3'>
                    {filteredMemories.length ? (
                      filteredMemories.map((memory, index) => {
                        const openByDefault = Boolean(query) && index === 0;

                        return (
                          <details
                            key={memory.id}
                            open={openByDefault}
                            className='rounded-[22px] border border-black/5 bg-white p-4 transition'
                          >
                            <summary className='list-none cursor-pointer'>
                              <div className='flex items-start justify-between gap-3'>
                                <div className='min-w-0 flex-1'>
                                  <div className='flex flex-wrap items-center gap-2'>
                                    <span className='rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-900'>
                                      {typeLabel[memory.type] || memory.type}
                                    </span>

                                    <span className='rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700'>
                                      {memory.petName}
                                    </span>

                                    <PrimaryPetBadge
                                      show={Boolean(
                                        memory.petId && memory.petId === primaryPetId,
                                      )}
                                      size='md'
                                    />

                                    <span className='rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-900'>
                                      Priority {memory.importance}
                                    </span>
                                  </div>

                                  <div className='mt-3 text-sm leading-7 text-ink'>
                                    {truncateText(memory.content, 120)}
                                  </div>

                                  <div className='mt-2 text-xs text-muted'>
                                    Updated {formatDate(memory.updatedAt)}
                                  </div>
                                </div>

                                <div className='shrink-0 rounded-full border border-black/5 bg-stone-50 px-3 py-1 text-[11px] font-bold text-muted'>
                                  Expand
                                </div>
                              </div>
                            </summary>

                            <div className='mt-4 border-t border-black/5 pt-4'>
                              <div className='rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-8 text-ink'>
                                {memory.content}
                              </div>

                              <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
                                <div className='text-xs text-muted'>
                                  Full detail · {typeLabel[memory.type] || memory.type} ·{' '}
                                  {memory.petName} · Priority {memory.importance}
                                </div>

                                <form action={deleteMemoryAction}>
                                  <input
                                    type='hidden'
                                    name='memoryId'
                                    value={memory.id}
                                  />
                                  {selectedPetId ? (
                                    <input
                                      type='hidden'
                                      name='petId'
                                      value={selectedPetId}
                                    />
                                  ) : null}
                                  <button className='rounded-full border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50'>
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </div>
                          </details>
                        );
                      })
                    ) : (
                      <div className='rounded-[24px] border border-dashed border-black/10 bg-stone-50 p-6'>
                        <PetNoticeBanner tone='warning'>
                          No memories match the current search or filters. Try clearing filters or go back to chat to create more memory entries.
                        </PetNoticeBanner>

                        <div className='mt-4 flex flex-wrap gap-3'>
                          <a
                            href={buildResetHref(selectedPetId)}
                            className='subtle-button'
                          >
                            Clear Filters
                          </a>
                          <a href={backToChatHref} className='brand-button'>
                            Back to Chat
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </section>
          </>
        ) : (
          <section className='mt-8'>
            <PetEmptyStateCard
              className='bg-white'
              title='No pet memories yet'
              description='Create your first pet and start chatting. Summaries and memory rows will appear here automatically.'
              primaryAction={{ label: 'Create Your First Pet', href: '/create-pet' }}
            />
          </section>
        )}
      </main>

      <SiteFooter rightText='Compact Memory Rows · Search / Filter / Sort · Collapsed Summaries · Mobile-First Stacking' />
    </>
  );
}
