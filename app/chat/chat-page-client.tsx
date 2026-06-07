'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChatPlayground } from '@/components/chat-playground';

type RawMessage = {
  role?: string;
  content?: string;
  text?: string;
};

type RawPet = Record<string, any>;

type PetProfile = {
  id: string;
  name: string;
  roleLabel: string;
  imageUrl: string | null;
  subtitle: string;
  moodTitle: string;
  moodDescription: string;
  notes: string[];
  vip: boolean;
  isPrimary: boolean;
  isLive: boolean;
  initialMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  initialRemainingLabel: string;
  initialMemorySummary?: string;
};

const PET_ENDPOINTS = ['/api/pets', '/api/companions'];

const liveBadgeClassName =
  'inline-flex items-center justify-center rounded-full border border-[#e5a962]/25 bg-[rgba(229,169,98,0.12)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f6d19b] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

function extractPetArray(payload: any): RawPet[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.pets)) return payload.pets;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.companions)) return payload.companions;
  if (Array.isArray(payload?.profiles)) return payload.profiles;
  return [];
}

function normalizeMessages(input: unknown): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(input)) return [];
  return input
    .map((item: RawMessage) => {
      const role = item?.role === 'user' ? 'user' : 'assistant';
      const content = String(item?.content ?? item?.text ?? '').trim();
      if (!content) return null;
      return { role, content };
    })
    .filter(Boolean) as Array<{ role: 'user' | 'assistant'; content: string }>;
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function pickBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

function normalizePet(raw: RawPet, index: number): PetProfile | null {
  const id = pickString(
    raw.id,
    raw.petId,
    raw._id,
    raw.uuid,
    raw.slug,
    raw.companionId
  );

  if (!id) return null;

  const name = pickString(raw.name, raw.petName, raw.title, `Pet ${index + 1}`);
  const imageUrl =
    pickString(
      raw.imageUrl,
      raw.avatarUrl,
      raw.petImageUrl,
      raw.photoUrl,
      raw.image,
      raw.avatar,
      raw.profileImageUrl
    ) || null;

  const roleLabel = pickString(raw.roleLabel, raw.type, raw.species, 'Companion');
  const subtitle = pickString(
    raw.subtitle,
    raw.shortDescription,
    raw.personality,
    raw.breed,
    'Always here to keep you company.'
  );

  const moodTitle = pickString(
    raw.moodTitle,
    raw.chatMoodTitle,
    'Emotionally present, softly attentive'
  );

  const moodDescription = pickString(
    raw.moodDescription,
    raw.chatMoodDescription,
    'A warmer, calmer chat space designed to keep your companion emotionally front and center.'
  );

  const notesRaw = raw.notes ?? raw.highlights ?? raw.moodNotes ?? raw.chatNotes ?? [];
  const notes = Array.isArray(notesRaw)
    ? notesRaw.map((item) => String(item).trim()).filter(Boolean)
    : String(notesRaw || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

  const vip = pickBoolean(raw.vip, raw.isVip, raw.pro)?.valueOf() ?? true;
  const isPrimary = pickBoolean(raw.isPrimary, raw.primary)?.valueOf() ?? index === 0;
  const isLive =
    pickBoolean(raw.isLive, raw.live)?.valueOf() ??
    String(raw.status ?? '').toLowerCase() === 'live';

  return {
    id,
    name,
    roleLabel,
    imageUrl,
    subtitle,
    moodTitle,
    moodDescription,
    notes:
      notes.length > 0
        ? notes
        : [
            'Best for rerun-style chats, memory prompts, and cozy daily check-ins.',
            'Great when you want warmth, direct affection, and lighter emotional pacing.',
          ],
    vip,
    isPrimary,
    isLive,
    initialMessages: normalizeMessages(raw.initialMessages ?? raw.messages ?? []),
    initialRemainingLabel: pickString(
      raw.initialRemainingLabel,
      raw.remainingLabel,
      raw.usageLabel,
      vip ? 'VIP — Unlimited Chat' : 'Companion Chat'
    ),
    initialMemorySummary: pickString(raw.initialMemorySummary, raw.memorySummary),
  };
}

async function fetchPets(): Promise<PetProfile[]> {
  let lastError = '';

  for (const endpoint of PET_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        lastError = `${endpoint} returned ${response.status}`;
        continue;
      }

      const payload = await response.json();
      const pets = extractPetArray(payload)
        .map(normalizePet)
        .filter(Boolean) as PetProfile[];

      if (pets.length > 0) return pets;
      lastError = `${endpoint} returned empty pet list`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown fetch error';
    }
  }

  throw new Error(lastError || 'Unable to load pets');
}

function PetAvatar({
  src,
  alt,
  size = 48,
}: {
  src?: string | null;
  alt: string;
  size?: number;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-white/8 text-lg ring-1 ring-white/10"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      🐾
    </div>
  );
}

function buildSearchHref(pathname: string, currentSearchParams: URLSearchParams, petId: string) {
  const next = new URLSearchParams(currentSearchParams.toString());
  next.set('pet_id', petId);
  next.delete('petId');
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function ChatPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pets, setPets] = useState<PetProfile[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const requestedPetId = searchParams.get('pet_id') || searchParams.get('petId') || null;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingPets(true);
      setPetsError(null);

      try {
        const loadedPets = await fetchPets();
        if (cancelled) return;
        setPets(loadedPets);
      } catch (error) {
        if (cancelled) return;
        setPets([]);
        setPetsError(error instanceof Error ? error.message : 'Failed to load pets.');
      } finally {
        if (!cancelled) {
          setLoadingPets(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pets.length) return;

    const matched =
      (requestedPetId && pets.find((pet) => pet.id === requestedPetId)) ||
      pets.find((pet) => pet.isPrimary) ||
      pets[0];

    if (!matched) return;

    if (selectedPetId !== matched.id) {
      setSelectedPetId(matched.id);
    }
  }, [pets, requestedPetId, selectedPetId]);

  const activePet = useMemo(() => {
    if (!pets.length) return null;
    return pets.find((pet) => pet.id === selectedPetId) || pets.find((pet) => pet.isPrimary) || pets[0];
  }, [pets, selectedPetId]);

  const handleSelectPet = (petId: string) => {
    setSelectedPetId(petId);
    const href = buildSearchHref(pathname, new URLSearchParams(searchParams.toString()), petId);
    router.replace(href, { scroll: false });
  };

  return (
    <div className="page-noir app-brand-backdrop min-h-screen">
      <main className="container-shell px-4 py-5 md:px-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <section className="mb-5 rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,166,0,0.08),rgba(255,255,255,0.02)_35%,rgba(0,0,0,0.3)_100%)] px-5 py-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:px-8 md:py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--noir-text-soft,#f3d6b0)]">
                  EchoPaws Noir Chat
                </div>

                <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                  A softer place to keep talking.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--noir-text-soft,#d7c0a7)] md:text-[15px]">
                  Your companion chat now follows the real pet bound to your account, so avatar,
                  selected state, and sent message all stay synchronized.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--noir-text-soft,#e7d1b9)]">
                    VIP — Unlimited
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--noir-text-soft,#e7d1b9)]">
                    Companion
                  </span>
                  <span className={liveBadgeClassName}>Live</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/memories"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Memories
                </Link>
                <Link
                  href="/pets"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Manage
                </Link>
              </div>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <section className="rounded-[26px] border border-white/10 bg-[rgba(15,10,8,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[var(--noir-text-muted,#9f8c7d)]">
                  Pet Switcher
                </div>

                <h2 className="text-2xl font-black tracking-tight text-white">
                  Choose your companion
                </h2>

                <div className="mt-4 space-y-3">
                  {loadingPets ? (
                    <>
                      <div className="h-[76px] animate-pulse rounded-[20px] bg-white/6" />
                      <div className="h-[76px] animate-pulse rounded-[20px] bg-white/6" />
                    </>
                  ) : pets.length > 0 ? (
                    pets.map((pet) => {
                      const active = activePet?.id === pet.id;

                      return (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => handleSelectPet(pet.id)}
                          className={[
                            'flex w-full items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition',
                            active
                              ? 'border-white/35 bg-[rgba(255,255,255,0.08)] shadow-[0_10px_30px_rgba(0,0,0,0.25)]'
                              : 'border-white/10 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)]',
                          ].join(' ')}
                        >
                          <PetAvatar src={pet.imageUrl} alt={pet.name} />

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-white">{pet.name}</div>
                            <div className="mt-0.5 truncate text-xs text-[var(--noir-text-muted,#a28f81)]">
                              {pet.roleLabel}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {pet.isPrimary ? (
                              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--noir-text-soft,#ead3b5)]">
                                Primary
                              </span>
                            ) : null}
                            {pet.isLive ? <span className={liveBadgeClassName}>Live</span> : null}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-[18px] border border-white/10 bg-white/4 p-4 text-sm text-[var(--noir-text-soft,#d9c4ab)]">
                      No companions found.
                    </div>
                  )}
                </div>

                {petsError ? (
                  <div className="mt-4 rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Failed to load pets: {petsError}
                  </div>
                ) : null}
              </section>

              <section className="rounded-[26px] border border-white/10 bg-[rgba(15,10,8,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[var(--noir-text-muted,#9f8c7d)]">
                  Companion Mood
                </div>

                {activePet ? (
                  <>
                    <h3 className="text-2xl font-black tracking-tight text-white">
                      {activePet.moodTitle}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[var(--noir-text-soft,#d7c0a7)]">
                      {activePet.moodDescription}
                    </p>

                    <div className="mt-4 space-y-3">
                      {activePet.notes.map((note, index) => (
                        <div
                          key={`${activePet.id}-note-${index}`}
                          className="rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-6 text-[var(--noir-text-soft,#d7c0a7)]"
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-[18px] border border-white/10 bg-white/4 p-4 text-sm text-[var(--noir-text-soft,#d9c4ab)]">
                    Select a companion to begin chatting.
                  </div>
                )}
              </section>
            </aside>

            <section className="min-w-0 rounded-[28px] border border-white/10 bg-[rgba(15,10,8,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl md:p-5">
              {loadingPets ? (
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-32 animate-pulse rounded-full bg-white/8" />
                    <div className="h-8 w-28 animate-pulse rounded-full bg-white/8" />
                  </div>
                  <div className="h-[520px] animate-pulse rounded-[24px] bg-white/5" />
                </div>
              ) : activePet ? (
                <ChatPlayground
                  key={activePet.id}
                  petId={activePet.id}
                  petName={activePet.name}
                  petImageUrl={activePet.imageUrl}
                  initialMessages={activePet.initialMessages}
                  initialRemainingLabel={activePet.initialRemainingLabel}
                  initialMemorySummary={activePet.initialMemorySummary}
                />
              ) : (
                <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-6 py-10 text-center">
                  <div className="text-lg font-bold text-white">No companion available</div>
                  <p className="mt-2 max-w-md text-sm leading-7 text-[var(--noir-text-soft,#d7c0a7)]">
                    Create or sync a pet first, then come back to chat with the correct avatar and pet binding.
                  </p>
                  <Link
                    href="/create-pet"
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffb020,#f97316)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_32px_rgba(249,115,22,0.28)] transition hover:brightness-105"
                  >
                    Create Pet
                  </Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
