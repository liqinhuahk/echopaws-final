'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChatPlayground } from '@/components/chat-playground';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

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
  initialMessages: ChatMessage[];
  initialRemainingLabel: string;
  initialMemorySummary?: string;
};

type RawPet = Record<string, any>;

const PET_ENDPOINTS = ['/api/pets', '/api/companions'];

const liveBadgeClassName =
  'inline-flex items-center justify-center rounded-full border border-[#e5a962]/25 bg-[rgba(229,169,98,0.12)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f6d19b] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

const DEMO_PETS: PetProfile[] = [
  {
    id: 'jojo',
    name: 'JoJo',
    roleLabel: 'Live Companion',
    imageUrl: null,
    subtitle: 'Playful, affectionate, and always ready to reply.',
    moodTitle: 'Bright, loyal, slightly clingy',
    moodDescription:
      'JoJo brings a more lively emotional rhythm to the room — warm, attached, and eager to react quickly.',
    notes: [
      'Best for energetic check-ins and more immediate emotional feedback.',
      'Great when you want companionship that feels lively and responsive.',
    ],
    vip: true,
    isPrimary: true,
    isLive: true,
    initialMessages: [
      {
        role: 'assistant',
        content:
          "Hi, I'm JoJo 🐾 I've been waiting for you. Tell me how your day is going and I’ll stay right here with you.",
      },
      {
        role: 'user',
        content: 'I am a little tired today.',
      },
      {
        role: 'assistant',
        content:
          'Then come sit with me for a moment. You do not need to carry the whole day alone.',
      },
    ],
    initialRemainingLabel: 'VIP — Unlimited Chat',
    initialMemorySummary: 'JoJo remembers your softer moods and likes gentle emotional check-ins.',
  },
  {
    id: 'mimi',
    name: 'Mimi',
    roleLabel: 'Companion',
    imageUrl: null,
    subtitle: 'Gentle, observant, and quietly comforting.',
    moodTitle: 'Soft, patient, emotionally attentive',
    moodDescription:
      'Mimi keeps the chat space calmer and more reflective, with a slower and warmer emotional pace.',
    notes: [
      'Best for slower late-night conversations and reflective moments.',
      'Great when you want calm reassurance rather than high-energy replies.',
    ],
    vip: true,
    isPrimary: false,
    isLive: false,
    initialMessages: [
      {
        role: 'assistant',
        content:
          "Hello, I'm Mimi 🤍 If you want, we can talk quietly for a while. I’m here with you.",
      },
      {
        role: 'user',
        content: 'Can you stay with me for a bit?',
      },
      {
        role: 'assistant',
        content:
          'Of course. You do not need to rush. We can just stay here and breathe together.',
      },
    ],
    initialRemainingLabel: 'VIP — Unlimited Chat',
    initialMemorySummary: 'Mimi holds calmer, soothing conversation starters for quiet moments.',
  },
];

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item: any) => {
      const role: 'user' | 'assistant' = item?.role === 'user' ? 'user' : 'assistant';
      const content = String(item?.content ?? item?.text ?? '').trim();
      if (!content) return null;
      return { role, content };
    })
    .filter(Boolean) as ChatMessage[];
}

function extractPetArray(payload: any): RawPet[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.pets)) return payload.pets;
  if (Array.isArray(payload?.companions)) return payload.companions;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.profiles)) return payload.profiles;
  return [];
}

function normalizePet(raw: RawPet, index: number): PetProfile | null {
  const id = firstNonEmptyString(
    raw.id,
    raw.petId,
    raw._id,
    raw.uuid,
    raw.slug,
    raw.companionId
  );

  if (!id) return null;

  const name = firstNonEmptyString(raw.name, raw.petName, raw.title, `Pet ${index + 1}`);
  const imageUrl =
    firstNonEmptyString(
      raw.imageUrl,
      raw.avatarUrl,
      raw.petImageUrl,
      raw.photoUrl,
      raw.image,
      raw.avatar,
      raw.profileImageUrl
    ) || null;

  const roleLabel = firstNonEmptyString(raw.roleLabel, raw.type, raw.species, 'Companion');
  const subtitle = firstNonEmptyString(
    raw.subtitle,
    raw.shortDescription,
    raw.personality,
    raw.breed,
    'Always here to keep you company.'
  );

  const moodTitle = firstNonEmptyString(
    raw.moodTitle,
    raw.chatMoodTitle,
    'Emotionally present, softly attentive'
  );

  const moodDescription = firstNonEmptyString(
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

  const vip = firstBoolean(raw.vip, raw.isVip, raw.pro) ?? true;
  const isPrimary = firstBoolean(raw.isPrimary, raw.primary) ?? index === 0;
  const isLive =
    firstBoolean(raw.isLive, raw.live) ??
    String(raw.status ?? '').trim().toLowerCase() === 'live';

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
    initialRemainingLabel: firstNonEmptyString(
      raw.initialRemainingLabel,
      raw.remainingLabel,
      raw.usageLabel,
      vip ? 'VIP — Unlimited Chat' : 'Companion Chat'
    ),
    initialMemorySummary: firstNonEmptyString(raw.initialMemorySummary, raw.memorySummary),
  };
}

async function fetchPetsFromApi(): Promise<{ pets: PetProfile[]; error: string | null }> {
  let lastError: string | null = null;

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

      if (pets.length > 0) {
        return { pets, error: null };
      }

      lastError = `${endpoint} returned empty pet list`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : `Failed to fetch ${endpoint}`;
    }
  }

  return { pets: [], error: lastError };
}

function PetAvatar({
  src,
  alt,
  fallbackText,
  size = 48,
}: {
  src?: string | null;
  alt: string;
  fallbackText: string;
  size?: number;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-2xl object-cover ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-white/8 text-sm font-black uppercase text-[var(--noir-text-soft,#f2dbc0)] ring-1 ring-white/10"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {fallbackText}
    </div>
  );
}

function buildSearchHref(
  pathname: string,
  currentSearchParams: URLSearchParams,
  petId: string
) {
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

  const [livePets, setLivePets] = useState<PetProfile[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const requestedPetId = searchParams.get('pet_id') || searchParams.get('petId') || null;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingPets(true);
      const result = await fetchPetsFromApi();
      if (cancelled) return;

      setLivePets(result.pets);
      setApiError(result.error);
      setLoadingPets(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const usingDemoPets = !loadingPets && livePets.length === 0;
  const pets = usingDemoPets ? DEMO_PETS : livePets;

  useEffect(() => {
    if (!pets.length) return;

    const nextPet =
      (requestedPetId && pets.find((pet) => pet.id === requestedPetId)) ||
      pets.find((pet) => pet.isPrimary) ||
      pets[0];

    if (nextPet && selectedPetId !== nextPet.id) {
      setSelectedPetId(nextPet.id);
    }
  }, [pets, requestedPetId, selectedPetId]);

  const activePet = useMemo(() => {
    if (!pets.length) return null;
    return pets.find((pet) => pet.id === selectedPetId) || pets.find((pet) => pet.isPrimary) || pets[0];
  }, [pets, selectedPetId]);

  function handleSelectPet(petId: string) {
    setSelectedPetId(petId);
    const href = buildSearchHref(pathname, new URLSearchParams(searchParams.toString()), petId);
    router.replace(href, { scroll: false });
  }

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
                  Your companion chat stays synchronized with the selected pet, while keeping a
                  graceful fallback to JoJo and Mimi if the live companion API is unavailable.
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

          {usingDemoPets ? (
            <div className="mb-4 rounded-[20px] border border-amber-300/15 bg-[rgba(229,169,98,0.10)] px-4 py-3 text-sm text-[var(--noir-text-soft,#f0d6b7)]">
              Live pets API is currently unavailable, so the page is showing the built-in JoJo / Mimi conversations.
              {apiError ? <span className="ml-2 opacity-80">({apiError})</span> : null}
            </div>
          ) : null}

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
                  ) : (
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
                          <PetAvatar
                            src={pet.imageUrl}
                            alt={pet.name}
                            fallbackText={pet.name.slice(0, 1)}
                          />

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
                  )}
                </div>
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
                  petId={usingDemoPets ? undefined : activePet.id}
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
