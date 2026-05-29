import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

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
  updated_at: string | null;
};

type MemoryRow = {
  id: string;
  pet_id: string;
  content: string;
  memory_type: string | null;
  priority: number | null;
  created_at: string | null;
  updated_at: string | null;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

function buildTypeLabel(value: string | null) {
  if (!value) return 'Memory';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildPriorityLabel(priority: number | null) {
  const value = priority ?? 0;

  if (value >= 4) return 'Priority 4';
  if (value === 3) return 'Priority 3';
  if (value === 2) return 'Priority 2';
  return 'Priority 1';
}

function buildPriorityTone(priority: number | null) {
  const value = priority ?? 0;

  if (value >= 4) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  if (value === 3) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

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

function buildExcerpt(value: string, maxLength = 120) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}…`;
}

function buildSummaryFromPetAndMemories(
  pet: PetRow | undefined,
  memories: MemoryRow[],
) {
  if (!pet) {
    if (!memories.length) {
      return 'No memory content yet. Once you chat more, this space can summarize recurring preferences, emotions, and routines.';
    }

    return `You currently have ${memories.length} memory entries. Use filters to narrow by type, priority, or keyword as the list grows.`;
  }

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

  const topClues = memories
    .filter((item) => item.content?.trim())
    .slice(0, 3)
    .map((item) => item.content.trim());

  if (topClues.length) {
    parts.push(`Recent memory clues: ${topClues.join(' ')}`);
  }

  if (!parts.length) {
    return `${pet.name} does not have a rich summary yet. More chats and memory saves will make this panel more helpful over time.`;
  }

  return parts.join(' ');
}

function buildReturnTo(searchParams?: SearchParams) {
  const params = new URLSearchParams();

  const petId = pickParam(searchParams?.pet_id);
  const q = pickParam(searchParams?.q);
  const type = pickParam(searchParams?.type);
  const priority = pickParam(searchParams?.priority);
  const sort = pickParam(searchParams?.sort);
  const expand = pickParam(searchParams?.expand);

  if (petId) params.set('pet_id', petId);
  if (q) params.set('q', q);
  if (type) params.set('type', type);
  if (priority) params.set('priority', priority);
  if (sort) params.set('sort', sort);
  if (expand) params.set('expand', expand);

  const query = params.toString();
  return query ? `/memories?${query}` : '/memories';
}

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  async function deleteMemoryAction(formData: FormData) {
    'use server';

    if (!hasSupabaseEnv()) {
      redirect('/memories?error=Please configure Supabase first.');
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login?message=Please sign in first to manage memories.');
    }

    const memoryId = String(formData.get('memoryId') || '').trim();
    const returnTo = String(formData.get('returnTo') || '/memories').trim();

    if (!memoryId) {
      redirect(returnTo || '/memories');
    }

    await supabase.from('pet_memories').delete().eq('id', memoryId).eq('user_id', user.id);

    revalidatePath('/memories');
    redirect(returnTo || '/memories');
  }

  if (!hasSupabaseEnv()) {
    redirect('/login?message=Please configure Supabase first.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please sign in first to open memories.');
  }

  const selectedPetId = pickParam(searchParams?.pet_id);
  const q = pickParam(searchParams?.q).trim();
  const type = pickParam(searchParams?.type).trim();
  const priority = pickParam(searchParams?.priority).trim();
  const sort = pickParam(searchParams?.sort).trim() || 'latest';
  const expand = pickParam(searchParams?.expand).trim();

  const [{ data: petsData }, { data: memoriesData }] = await Promise.all([
    supabase
      .from('pets')
      .select(
        'id, name, breed, personality, favorite_food, daily_habits, image_url, is_default, updated_at',
      )
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false }),
    supabase
      .from('pet_memories')
      .select('id, pet_id, content, memory_type, priority, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(500),
  ]);

  const pets = (petsData ?? []) as PetRow[];
  const allMemories = (memoriesData ?? []) as MemoryRow[];

  if (!pets.length) {
    return (
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
    );
  }

  const selectedPet =
    pets.find((pet) => pet.id === selectedPetId) ??
    pets.find((pet) => pet.is_default) ??
    pets[0];

  let filteredMemories = allMemories.filter((item) => {
    if (selectedPetId && item.pet_id !== selectedPetId) return false;

    if (q) {
      const haystack = `${item.content} ${item.memory_type ?? ''}`.toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }

    if (type && type !== 'all') {
      if ((item.memory_type ?? '') !== type) return false;
    }

    if (priority && priority !== 'all') {
      if (priority === '4' && (item.priority ?? 0) < 4) return false;
      if (priority === '3' && (item.priority ?? 0) !== 3) return false;
      if (priority === '2' && (item.priority ?? 0) !== 2) return false;
      if (priority === '1' && (item.priority ?? 0) <= 1) {
        return true;
      }
      if (priority === '1' && (item.priority ?? 0) > 1) return false;
    }

    return true;
  });

  filteredMemories = [...filteredMemories].sort((a, b) => {
    if (sort === 'highest_priority') {
      return (b.priority ?? 0) - (a.priority ?? 0) ||
        new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
    }

    if (sort === 'oldest') {
      return new Date(a.updated_at ?? 0).getTime() - new Date(b.updated_at ?? 0).getTime();
    }

    if (sort === 'type') {
      return buildTypeLabel(a.memory_type).localeCompare(buildTypeLabel(b.memory_type));
    }

    return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
  });

  const availableTypes = Array.from(
    new Set(allMemories.map((item) => item.memory_type).filter(Boolean) as string[]),
  ).sort();

  const currentScopeMemories = selectedPetId
    ? allMemories.filter((item) => item.pet_id === selectedPetId)
    : allMemories;

  const returnTo = buildReturnTo(searchParams);

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mb-6 rounded-[30px] border border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 p-6 shadow-sm'>
        <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
          Memories List
        </div>
        <div className='mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h1 className='text-3xl font-black tracking-tight text-slate-900'>
              Searchable memory management
            </h1>
            <p className='mt-2 max-w-3xl text-sm leading-7 text-slate-600'>
              This version keeps rows compact by default, splits the toolbar into stable sections,
              and lets the list grow without turning into an endless tall wall of cards.
            </p>
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
              {selectedPet?.image_url ? (
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
                  <h2 className='truncate text-xl font-black text-slate-900'>
                    {selectedPet?.name ?? 'All Pets'}
                  </h2>
                  {selectedPet?.is_default ? (
                    <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700'>
                      Primary
                    </span>
                  ) : null}
                </div>

                <div className='mt-2 flex flex-wrap gap-2 text-xs text-slate-600'>
                  {selectedPet?.breed ? (
                    <span className='rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700'>
                      {selectedPet.breed}
                    </span>
                  ) : null}
                  <span className='rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-800'>
                    {currentScopeMemories.length} memories
                  </span>
                </div>

                <p className='mt-3 text-sm leading-7 text-slate-600'>
                  Updated {formatDateLabel(selectedPet?.updated_at ?? null)}
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
              <Link
                href='/memories'
                className={[
                  'rounded-[22px] border px-4 py-3 transition',
                  !selectedPetId
                    ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
                ].join(' ')}
              >
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <div className='text-sm font-black text-slate-900'>All Pets</div>
                    <div className='mt-1 text-xs text-slate-500'>Cross-pet memory list</div>
                  </div>
                  {!selectedPetId ? (
                    <span className='rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-bold text-white'>
                      Active
                    </span>
                  ) : null}
                </div>
              </Link>

              {pets.map((pet) => {
                const active = pet.id === selectedPetId || (!selectedPetId && pet.id === selectedPet.id);

                return (
                  <Link
                    key={pet.id}
                    href={`/memories?pet_id=${encodeURIComponent(pet.id)}`}
                    className={[
                      'rounded-[22px] border px-4 py-3 transition',
                      pet.id === selectedPetId
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

                      {pet.id === selectedPetId ? (
                        <span className='rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-bold text-white'>
                          Active
                        </span>
                      ) : active && !selectedPetId ? (
                        <span className='rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600'>
                          Default
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
              {buildSummaryFromPetAndMemories(selectedPet, currentScopeMemories)}
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

        <main className='min-w-0 space-y-5'>
          <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm'>
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
                  href={selectedPetId ? `/memories?pet_id=${encodeURIComponent(selectedPetId)}&expand=all` : '/memories?expand=all'}
                  className='rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50'
                >
                  Expand all
                </Link>
                <Link
                  href={selectedPetId ? `/memories?pet_id=${encodeURIComponent(selectedPetId)}` : '/memories'}
                  className='rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50'
                >
                  Compact default
                </Link>
              </div>
            </div>

            <form action='/memories' method='get' className='mt-5 space-y-4'>
              {selectedPetId ? <input type='hidden' name='pet_id' value={selectedPetId} /> : null}

              <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]'>
                <label className='grid gap-2'>
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
                    href={selectedPetId ? `/memories?pet_id=${encodeURIComponent(selectedPetId)}` : '/memories'}
                    className='rounded-full border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50'
                  >
                    Reset view
                  </Link>
                </div>
              </div>

              <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                <label className='grid gap-2 min-w-0'>
                  <span className='text-sm font-bold text-slate-800'>Type</span>
                  <select name='type' defaultValue={type || 'all'} className='input-shell w-full'>
                    <option value='all'>All types</option>
                    {availableTypes.map((item) => (
                      <option key={item} value={item}>
                        {buildTypeLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className='grid gap-2 min-w-0'>
                  <span className='text-sm font-bold text-slate-800'>Priority</span>
                  <select
                    name='priority'
                    defaultValue={priority || 'all'}
                    className='input-shell w-full'
                  >
                    <option value='all'>All priorities</option>
                    <option value='4'>Priority 4</option>
                    <option value='3'>Priority 3</option>
                    <option value='2'>Priority 2</option>
                    <option value='1'>Priority 1</option>
                  </select>
                </label>

                <label className='grid gap-2 min-w-0'>
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

          <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm'>
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

            {!filteredMemories.length ? (
              <div className='mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center'>
                <div className='text-lg font-black text-slate-900'>No memories match this view</div>
                <p className='mt-2 text-sm leading-7 text-slate-600'>
                  Try a broader search, change the type or priority filter, or reset the view.
                </p>
              </div>
            ) : (
              <div className='mt-5 space-y-3'>
                {filteredMemories.map((memory) => {
                  const pet = pets.find((item) => item.id === memory.pet_id);
                  const open = expand === 'all';

                  return (
                    <details
                      key={memory.id}
                      open={open}
                      className='group rounded-[24px] border border-slate-200 bg-white transition open:border-orange-200 open:shadow-sm'
                    >
                      <summary className='list-none cursor-pointer px-4 py-4 sm:px-5'>
                        <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                          <div className='min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <span className='rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-800'>
                                {buildTypeLabel(memory.memory_type)}
                              </span>

                              <span
                                className={[
                                  'rounded-full border px-2.5 py-1 text-[11px] font-bold',
                                  buildPriorityTone(memory.priority),
                                ].join(' ')}
                              >
                                {buildPriorityLabel(memory.priority)}
                              </span>

                              {pet ? (
                                <span className='rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700'>
                                  {pet.name}
                                </span>
                              ) : null}

                              {pet?.is_default ? (
                                <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700'>
                                  Primary
                                </span>
                              ) : null}
                            </div>

                            <div className='mt-3 truncate text-sm font-semibold text-slate-900'>
                              {buildExcerpt(memory.content, 140)}
                            </div>

                            <div className='mt-2 text-xs text-slate-500'>
                              Updated {formatDateLabel(memory.updated_at)}
                            </div>
                          </div>

                          <div className='flex items-center gap-2 text-xs text-slate-500'>
                            <span className='rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 transition group-open:bg-orange-50 group-open:text-orange-800'>
                              {open ? 'Expanded by default' : 'Click to expand'}
                            </span>
                          </div>
                        </div>
                      </summary>

                      <div className='border-t border-slate-100 px-4 py-4 sm:px-5'>
                        <div className='rounded-[20px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700'>
                          {memory.content}
