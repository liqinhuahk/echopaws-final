'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import SiteHeader from '@/components/site-header';

type PetRecord = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  ownerId: string | null;
};

type MemoryRecord = {
  id: string;
  petId: string | null;
  petName: string | null;
  ownerId: string | null;
  type: string;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
  source: string | null;
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const PET_TABLE_CANDIDATES = ['pets', 'companions', 'user_pets'] as const;
const MEMORY_TABLE_CANDIDATES = ['pet_memories', 'memories', 'companion_memories'] as const;

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return null;

  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

function pickString(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function pickBoolean(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'boolean') return value;
  }
  return null;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

function formatDateTime(value: string | null) {
  if (!value) return 'Unknown time';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatRelative(value: string | null) {
  if (!value) return 'Unknown time';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (abs < hour) return rtf.format(Math.round(diff / minute), 'minute');
  if (abs < day) return rtf.format(Math.round(diff / hour), 'hour');
  return rtf.format(Math.round(diff / day), 'day');
}

function titleCase(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

function normalizePet(row: Record<string, unknown>): PetRecord | null {
  const id =
    pickString(row, ['id', 'pet_id', 'companion_id']) ??
    `pet-${pickString(row, ['name', 'pet_name', 'title']) ?? Math.random().toString(36).slice(2)}`;

  const name = pickString(row, ['name', 'pet_name', 'title']) ?? 'Companion';
  const ownerId = pickString(row, ['user_id', 'owner_id', 'profile_id', 'account_id']);
  const avatarUrl = pickString(row, ['avatar_url', 'photo_url', 'image_url', 'portrait_url']);
  const explicitRole = pickString(row, ['role', 'kind', 'pet_role', 'relationship']);
  const isPrimary = pickBoolean(row, ['is_primary', 'primary_pet']);

  return {
    id,
    name,
    ownerId,
    avatarUrl,
    role: explicitRole ?? (isPrimary ? 'Primary pet' : 'Companion'),
  };
}

function normalizeMemory(row: Record<string, unknown>): MemoryRecord | null {
  const content = pickString(row, ['content', 'text', 'body', 'memory', 'summary', 'note']);
  if (!content) return null;

  const createdAt = pickString(row, ['created_at', 'inserted_at', 'timestamp']);
  const updatedAt = pickString(row, ['updated_at', 'last_updated_at']);

  return {
    id: pickString(row, ['id', 'memory_id']) ?? `memory-${Math.random().toString(36).slice(2)}`,
    petId: pickString(row, ['pet_id', 'companion_id']),
    petName: pickString(row, ['pet_name', 'name']),
    ownerId: pickString(row, ['user_id', 'owner_id', 'profile_id', 'account_id']),
    type: pickString(row, ['memory_type', 'type', 'category', 'kind']) ?? 'general',
    content,
    createdAt,
    updatedAt,
    source: pickString(row, ['source', 'origin']),
  };
}

async function queryFirstWorkingTable(
  supabase: SupabaseClient,
  tables: readonly string[],
  limit: number
): Promise<Record<string, unknown>[]> {
  for (const table of tables) {
    try {
      const result = await supabase.from(table).select('*').limit(limit);
      if (!result.error && Array.isArray(result.data)) {
        return result.data as Record<string, unknown>[];
      }
    } catch {
      continue;
    }
  }
  return [];
}

function getLatestTimestamp(items: MemoryRecord[]) {
  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => {
    const aTime = parseDate(a.updatedAt ?? a.createdAt) ?? 0;
    const bTime = parseDate(b.updatedAt ?? b.createdAt) ?? 0;
    return bTime - aTime;
  });

  return sorted[0]?.updatedAt ?? sorted[0]?.createdAt ?? null;
}

function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'sm' ? 'h-10 w-10 text-sm' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-12 w-12 text-base';

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(
          sizeClass,
          'rounded-2xl border border-[rgba(255,214,179,0.18)] object-cover shadow-[0_10px_26px_rgba(0,0,0,0.22)]'
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        'flex items-center justify-center rounded-2xl border border-[rgba(255,214,179,0.18)] bg-[linear-gradient(180deg,#ffbe72,#ff9531)] font-semibold text-[#2f160c] shadow-[0_10px_26px_rgba(255,145,51,0.2)]'
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function SectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(28,15,11,0.84),rgba(14,8,6,0.92))] shadow-[0_30px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export default function MemoriesPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [state, setState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [pets, setPets] = useState<PetRecord[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);

  const [draftSearch, setDraftSearch] = useState('');
  const [draftType, setDraftType] = useState('all');
  const [draftSort, setDraftSort] = useState<'latest' | 'oldest'>('latest');

  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedType, setAppliedType] = useState('all');
  const [appliedSort, setAppliedSort] = useState<'latest' | 'oldest'>('latest');

  const loadData = useCallback(async () => {
    if (!supabase) {
      setState('error');
      setErrorMessage('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }

    setState('loading');
    setErrorMessage(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setState('error');
        setErrorMessage('Please sign in to view your memories.');
        return;
      }

      const petRows = await queryFirstWorkingTable(supabase, PET_TABLE_CANDIDATES, 100);
      const memoryRows = await queryFirstWorkingTable(supabase, MEMORY_TABLE_CANDIDATES, 500);

      const normalizedPets = petRows
        .map((row) => normalizePet(row))
        .filter((item): item is PetRecord => Boolean(item))
        .filter((item) => !item.ownerId || item.ownerId === user.id);

      const normalizedMemories = memoryRows
        .map((row) => normalizeMemory(row))
        .filter((item): item is MemoryRecord => Boolean(item))
        .filter((item) => !item.ownerId || item.ownerId === user.id);

      let resolvedPets = normalizedPets;

      if (resolvedPets.length === 0 && normalizedMemories.length > 0) {
        const synthetic = new Map<string, PetRecord>();

        for (const memory of normalizedMemories) {
          const key = memory.petId ?? memory.petName ?? memory.id;

          if (!synthetic.has(key)) {
            synthetic.set(key, {
              id: memory.petId ?? key,
              name: memory.petName ?? 'Companion',
              role: 'Companion',
              avatarUrl: null,
              ownerId: memory.ownerId ?? user.id,
            });
          }
        }

        resolvedPets = Array.from(synthetic.values());
      }

      const dedupedPets = Array.from(new Map(resolvedPets.map((pet) => [pet.id, pet])).values());

      setPets(dedupedPets);
      setMemories(normalizedMemories);

      setActivePetId((current) => {
        if (current && dedupedPets.some((pet) => pet.id === current)) return current;
        return dedupedPets[0]?.id ?? null;
      });

      setState('ready');
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load memories.');
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activePet = useMemo(() => {
    if (!pets.length) return null;
    return pets.find((pet) => pet.id === activePetId) ?? pets[0];
  }, [pets, activePetId]);

  const matchesPet = useCallback((memory: MemoryRecord, pet: PetRecord | null) => {
    if (!pet) return true;

    const memoryPetId = memory.petId?.trim().toLowerCase();
    const petId = pet.id.trim().toLowerCase();

    if (memoryPetId && memoryPetId === petId) return true;

    const memoryPetName = memory.petName?.trim().toLowerCase();
    const petName = pet.name.trim().toLowerCase();

    if (memoryPetName && memoryPetName === petName) return true;

    return false;
  }, []);

  const allMemoriesForActivePet = useMemo(() => {
    return memories.filter((memory) => matchesPet(memory, activePet));
  }, [memories, activePet, matchesPet]);

  const availableTypes = useMemo(() => {
    const set = new Set<string>();

    for (const memory of allMemoriesForActivePet) {
      const type = memory.type.trim().toLowerCase();
      if (type) set.add(type);
    }

    return ['all', ...Array.from(set)];
  }, [allMemoriesForActivePet]);

  const filteredMemories = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();

    return allMemoriesForActivePet
      .filter((memory) => {
        if (appliedType !== 'all' && memory.type.trim().toLowerCase() !== appliedType) {
          return false;
        }

        if (!keyword) return true;

        const haystack = [
          memory.content,
          memory.type,
          memory.source ?? '',
          memory.petName ?? '',
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(keyword);
      })
      .sort((a, b) => {
        const aTime = parseDate(a.updatedAt ?? a.createdAt) ?? 0;
        const bTime = parseDate(b.updatedAt ?? b.createdAt) ?? 0;
        return appliedSort === 'latest' ? bTime - aTime : aTime - bTime;
      });
  }, [allMemoriesForActivePet, appliedSearch, appliedSort, appliedType]);

  const memoriesByPet = useMemo(() => {
    const map = new Map<string, MemoryRecord[]>();

    for (const pet of pets) {
      map.set(
        pet.id,
        memories.filter((memory) => matchesPet(memory, pet))
      );
    }

    return map;
  }, [pets, memories, matchesPet]);

  const applyFilters = () => {
    setAppliedSearch(draftSearch);
    setAppliedType(draftType);
    setAppliedSort(draftSort);
  };

  const resetFilters = () => {
    setDraftSearch('');
    setDraftType('all');
    setDraftSort('latest');

    setAppliedSearch('');
    setAppliedType('all');
    setAppliedSort('latest');
  };

  const activePetMemoryCount = activePet ? memoriesByPet.get(activePet.id)?.length ?? 0 : 0;
  const activePetUpdatedAt = activePet ? getLatestTimestamp(memoriesByPet.get(activePet.id) ?? []) : null;

  return (
    <div className="min-h-screen bg-[#0b0706] text-[#f8efe8]">
      <SiteHeader />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,140,48,0.18),transparent_22%),radial-gradient(circle_at_84%_14%,rgba(255,170,82,0.10),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(255,110,52,0.08),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:44px_44px]"
      />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <SectionCard className="overflow-hidden">
          <div className="relative px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,139,47,0.12),transparent_48%,rgba(255,139,47,0.05)_100%)]"
            />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-4">
                  <Avatar name={activePet?.name ?? 'M'} src={activePet?.avatarUrl} size="lg" />
                  <div className="min-w-0">
                    <h1 className="truncate font-serif text-4xl tracking-[-0.04em] text-[#fff4ec] sm:text-5xl md:text-6xl">
                      Memories of {activePet?.name ?? 'Your Companion'}
                    </h1>
                  </div>
                </div>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-[rgba(255,233,220,0.72)] sm:text-[15px]">
                  Searchable memories, cleaner filters, and a softer brand shell so the page feels like a natural
                  continuation of Home, Chat, and Account.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/chat"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-5 font-medium text-[#fff4ec] transition hover:bg-white/5"
                >
                  Back to Chat
                </Link>
                <Link
                  href="/pets"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-5 font-medium text-[#fff4ec] transition hover:bg-white/5"
                >
                  Manage Pets
                </Link>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-5">
            <SectionCard className="p-5">
              <div className="flex items-start gap-4">
                <Avatar name={activePet?.name ?? 'M'} src={activePet?.avatarUrl} />
                <div className="min-w-0">
                  <div className="truncate text-[22px] font-semibold tracking-[-0.03em] text-[#fff5ee]">
                    {activePet?.name ?? 'Companion'}
                  </div>
                  <div className="mt-1 text-sm text-[rgba(255,233,220,0.70)]">
                    {activePetMemoryCount} memories
                  </div>
                  <div className="mt-1 text-xs text-[rgba(255,233,220,0.48)]">
                    Updated {formatRelative(activePetUpdatedAt)}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="p-5">
              <div className="text-[13px] uppercase tracking-[0.22em] text-[#efc39e]">Pet switcher</div>
              <div className="mt-4 text-[24px] font-serif tracking-[-0.03em] text-[#fff4eb]">Memory scope</div>

              <div className="mt-5 space-y-3">
                {pets.length === 0 ? (
                  <div className="rounded-[22px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-sm text-[rgba(255,233,220,0.68)]">
                    No pets found yet.
                  </div>
                ) : (
                  pets.map((pet) => {
                    const petMemories = memoriesByPet.get(pet.id) ?? [];
                    const lastUpdated = getLatestTimestamp(petMemories);

                    return (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => setActivePetId(pet.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-[22px] border px-4 py-4 text-left transition',
                          activePet?.id === pet.id
                            ? 'border-[rgba(255,180,103,0.35)] bg-[linear-gradient(180deg,rgba(255,153,69,0.08),rgba(255,255,255,0.03))] shadow-[0_16px_36px_rgba(0,0,0,0.18)]'
                            : 'border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.02)] hover:bg-white/[0.04]'
                        )}
                      >
                        <Avatar name={pet.name} src={pet.avatarUrl} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-[#fff5ee]">{pet.name}</div>
                          <div className="truncate text-xs text-[rgba(255,233,220,0.60)]">{pet.role}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs font-medium text-[#efc39e]">{petMemories.length} memories</div>
                          <div className="mt-1 text-[10px] text-[rgba(255,233,220,0.45)]">
                            {formatRelative(lastUpdated)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </SectionCard>

            <SectionCard className="p-5">
              <div className="text-[18px] font-medium text-[#fff4ec]">Companion snapshot</div>
              <p className="mt-3 text-sm leading-7 text-[rgba(255,233,220,0.70)]">
                {activePetMemoryCount > 0
                  ? `${activePet?.name ?? 'Your companion'} has ${activePetMemoryCount} saved memories available in this view.`
                  : `${activePet?.name ?? 'Your companion'} is building an ongoing emotional memory space with you.`}
              </p>
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard className="p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.3fr)_220px_160px_auto_auto] md:items-end">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.20em] text-[#efc39e]">
                    Search
                  </label>
                  <input
                    value={draftSearch}
                    onChange={(e) => setDraftSearch(e.target.value)}
                    placeholder="Search memory text"
                    className="h-11 w-full rounded-xl border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.05)] px-4 text-sm text-[#fff5ee] outline-none placeholder:text-[rgba(255,233,220,0.35)] transition focus:border-[rgba(255,180,103,0.35)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.20em] text-[#efc39e]">
                    Type
                  </label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.05)] px-4 text-sm text-[#fff5ee] outline-none transition focus:border-[rgba(255,180,103,0.35)]"
                  >
                    {availableTypes.map((type) => (
                      <option key={type} value={type} className="bg-[#170e0a]">
                        {type === 'all' ? 'All types' : titleCase(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.20em] text-[#efc39e]">
                    Sort
                  </label>
                  <select
                    value={draftSort}
                    onChange={(e) => setDraftSort(e.target.value as 'latest' | 'oldest')}
                    className="h-11 w-full rounded-xl border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.05)] px-4 text-sm text-[#fff5ee] outline-none transition focus:border-[rgba(255,180,103,0.35)]"
                  >
                    <option value="latest" className="bg-[#170e0a]">
                      Latest
                    </option>
                    <option value="oldest" className="bg-[#170e0a]">
                      Oldest
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={applyFilters}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(255,180,103,0.28)] bg-[rgba(255,146,50,0.12)] px-5 text-sm font-medium text-[#fff4ec] transition hover:bg-[rgba(255,146,50,0.18)]"
                >
                  Apply
                </button>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-11 items-center justify-center rounded-full px-2 text-sm font-medium text-[rgba(255,233,220,0.74)] transition hover:text-white"
                >
                  Reset
                </button>
              </div>

              <div className="mt-4 text-sm text-[rgba(255,233,220,0.64)]">{filteredMemories.length} results</div>
            </SectionCard>

            <SectionCard className="min-h-[380px] p-5">
              {state === 'loading' || state === 'idle' ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-28 animate-pulse rounded-[24px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)]"
                    />
                  ))}
                </div>
              ) : state === 'error' ? (
                <div className="rounded-[24px] border border-[rgba(255,120,120,0.18)] bg-[rgba(255,90,90,0.06)] p-5 text-sm leading-7 text-[#ffd8d8]">
                  {errorMessage ?? 'Unable to load memories right now.'}
                </div>
              ) : filteredMemories.length === 0 ? (
                <div className="rounded-[24px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.02)] p-5 text-sm leading-7 text-[rgba(255,233,220,0.68)]">
                  {allMemoriesForActivePet.length === 0
                    ? 'No memories have been saved for this companion yet. If Chat already shows memory updates, the chat save flow likely is not writing records into the persistent memories table.'
                    : 'No memories matched your current filters yet.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMemories.map((memory) => {
                    const stamp = memory.updatedAt ?? memory.createdAt;

                    return (
                      <article
                        key={memory.id}
                        className="rounded-[24px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex h-8 items-center rounded-full border border-[rgba(255,180,103,0.24)] bg-[rgba(255,146,50,0.10)] px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#efc39e]">
                            {titleCase(memory.type)}
                          </span>

                          {memory.source ? (
                            <span className="inline-flex h-8 items-center rounded-full border border-[rgba(255,233,220,0.10)] bg-[rgba(255,255,255,0.03)] px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[rgba(255,233,220,0.58)]">
                              {memory.source}
                            </span>
                          ) : null}

                          <span className="ml-auto text-xs text-[rgba(255,233,220,0.50)]">
                            {formatDateTime(stamp)}
                          </span>
                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-8 text-[rgba(255,244,236,0.92)]">
                          {memory.content}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}
