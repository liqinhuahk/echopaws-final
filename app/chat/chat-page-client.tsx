'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from 'react';
import SiteHeader from '@/components/site-header';
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

const DEMO_PETS: PetProfile[] = [
  {
    id: 'jojo',
    name: 'JoJo',
    roleLabel: 'Live Companion',
    imageUrl: null,
    subtitle: 'Playful, affectionate, and always ready to reply.',
    moodTitle: 'Bright, loyal, slightly clingy',
    moodDescription:
      'JoJo brings a lively emotional rhythm — warm, attached, and eager to react quickly.',
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
    ],
    initialRemainingLabel: 'VIP — Unlimited Chat',
    initialMemorySummary:
      'JoJo remembers your softer moods and likes gentle emotional check-ins.',
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
    ],
    initialRemainingLabel: 'VIP — Unlimited Chat',
    initialMemorySummary:
      'Mimi holds calmer, soothing conversation starters for quiet moments.',
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
      const role: 'user' | 'assistant' =
        item?.role === 'user' ? 'user' : 'assistant';
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
      raw.profileImageUrl,
      raw.image_url,
      raw.avatar_url,
      raw.photo_url
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

  const initialMessages = normalizeMessages(raw.initialMessages ?? raw.messages ?? []);

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
            'Best for cozy daily check-ins and memory-aware chats.',
            'Great when you want warmth, direct affection, and softer pacing.',
          ],
    vip,
    isPrimary,
    isLive,
    initialMessages:
      initialMessages.length > 0
        ? initialMessages
        : [
            {
              role: 'assistant',
              content: `Hi, I'm ${name} 🐾 I'm here with you.`,
            },
          ],
    initialRemainingLabel: firstNonEmptyString(
      raw.initialRemainingLabel,
      raw.remainingLabel,
      raw.usageLabel,
      vip ? 'VIP — Unlimited Chat' : 'Companion Chat'
    ),
    initialMemorySummary: firstNonEmptyString(
      raw.initialMemorySummary,
      raw.memorySummary
    ),
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
      lastError =
        error instanceof Error ? error.message : `Failed to fetch ${endpoint}`;
    }
  }

  return { pets: [], error: lastError };
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
      // eslint-disable-next-line @next/next/no-img-element
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

export default function ChatPageClient() {
  const pathname = usePathname() || '/chat';
  const searchParams = useSearchParams();

  const SafeSiteHeader: ComponentType<any> | null =
    typeof SiteHeader === 'function' ? SiteHeader : null;

  const SafeChatPlayground: ComponentType<any> | null =
    typeof ChatPlayground === 'function' ? ChatPlayground : null;

  const [livePets, setLivePets] = useState<PetProfile[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const requestedPetId =
    searchParams.get('pet_id') || searchParams.get('petId') || null;

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

  const activePet = useMemo(() => {
    if (!pets.length) return null;

    return (
      (requestedPetId && pets.find((pet) => pet.id === requestedPetId)) ||
      pets.find((pet) => pet.isPrimary) ||
      pets[0]
    );
  }, [pets, requestedPetId]);

  const activePetLinks = useMemo(() => {
    return pets.map((pet) => ({
      ...pet,
      href: buildSearchHref(pathname, searchParams, pet.id),
    }));
  }, [pets, pathname, searchParams]);

  return (
    <div className="min-h-screen bg-[#0c0706] text-[#fff7ed]">
      {SafeSiteHeader ? (
        <SafeSiteHeader theme="dark" />
      ) : (
        <div className="sticky top-0 z-40 border-b border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          Header component unavailable. Check <code>components/site-header.tsx</code> export.
        </div>
      )}

      <main className="mx-auto w-full max-w-[1240px] px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-7">
          <div className="inline-flex items-center rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-[0.64rem] font-extrabold uppercase tracking-[0.22em] text-[#f6cf7b]">
            ✦ Warm companion chat
          </div>

          <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-[clamp(2.2rem,4vw,4rem)] font-black leading-[0.95] tracking-[-0.04em] text-[#fff7ed]">
                {activePet ? `Chat with ${activePet.name}` : 'Your companion chat'}
              </h1>

              <p className="mt-3 max-w-3xl text-[0.95rem] leading-7 text-[rgba(255,244,230,0.78)]">
                {activePet
                  ? activePet.subtitle
                  : 'A softer, calmer chat space designed to keep your companion emotionally front and center.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-[#f6cf7b]">
                  {usingDemoPets ? 'Demo data' : 'Live data'}
                </span>
                {activePet ? (
                  <span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-bold text-[rgba(255,244,230,0.78)]">
                    {activePet.vip ? 'VIP — Unlimited Chat' : 'Companion chat'}
                  </span>
                ) : null}
                {apiError ? (
                  <span className="inline-flex items-center rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-100">
                    API fallback active
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/memories"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/22 bg-white/[0.03] px-5 text-sm font-bold text-white transition hover:bg-white/[0.06]"
              >
                Memories
              </Link>
              <Link
                href="/pets"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/22 bg-white/[0.03] px-5 text-sm font-bold text-white transition hover:bg-white/[0.06]"
              >
                Manage Pets
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="grid gap-5">
            <section className="rounded-[28px] border border-white/8 bg-[rgba(15,10,8,0.72)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="text-[0.64rem] font-extrabold uppercase tracking-[0.24em] text-[#f3c86b]">
                Pet switcher
              </div>

              <h2 className="mt-3 text-[1.9rem] font-black leading-none tracking-[-0.04em] text-[#fff7ed]">
                Choose your companion
              </h2>

              <div className="mt-5 grid gap-3">
                {loadingPets ? (
                  <>
                    <div className="h-20 animate-pulse rounded-[22px] bg-white/5" />
                    <div className="h-20 animate-pulse rounded-[22px] bg-white/5" />
                  </>
                ) : activePetLinks.length > 0 ? (
                  activePetLinks.map((pet) => {
                    const active = activePet?.id === pet.id;

                    return (
                      <Link
                        key={pet.id}
                        href={pet.href}
                        aria-current={active ? 'page' : undefined}
                        className={[
                          'group rounded-[22px] border px-4 py-3 transition duration-200',
                          active
                            ? 'border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(249,115,22,0.08))] shadow-[0_10px_28px_rgba(249,115,22,0.14)]'
                            : 'border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-3">
                          <PetAvatar
                            src={pet.imageUrl}
                            alt={pet.name}
                            fallbackText={pet.name.slice(0, 1)}
                            size={44}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-extrabold text-[#fff7ed]">
                              {pet.name}
                            </div>
                            <div className="text-xs text-[rgba(255,244,230,0.60)]">
                              {pet.isPrimary ? 'Primary pet' : pet.roleLabel}
                            </div>
                          </div>

                          {active ? (
                            <span className="inline-flex h-7 items-center rounded-full border border-amber-300/30 bg-amber-300/14 px-3 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-[#f6cf7b]">
                              Live
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-[rgba(255,244,230,0.70)]">
                    No companion data available yet.
                  </div>
                )}
              </div>

              {apiError ? (
                <div className="mt-4 rounded-2xl border border-amber-300/12 bg-amber-300/8 px-4 py-3 text-xs leading-6 text-[rgba(255,244,230,0.72)]">
                  Could not load live pets from API, so the page is using fallback data. Error:
                  <div className="mt-1 break-words text-[rgba(255,244,230,0.88)]">{apiError}</div>
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-white/8 bg-[rgba(15,10,8,0.72)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="text-[0.64rem] font-extrabold uppercase tracking-[0.24em] text-[#f3c86b]">
                Companion mood
              </div>

              <h3 className="mt-3 text-[1.9rem] font-black leading-[1.02] tracking-[-0.04em] text-[#fff7ed]">
                {activePet?.moodTitle || 'Emotionally present, softly attentive'}
              </h3>

              <p className="mt-4 text-sm leading-7 text-[rgba(255,244,230,0.78)]">
                {activePet?.moodDescription ||
                  'A warmer, calmer chat space designed to keep your companion emotionally front and center.'}
              </p>

              {activePet?.notes?.length ? (
                <div className="mt-5 grid gap-3">
                  {activePet.notes.map((note, index) => (
                    <div
                      key={`${activePet.id}-note-${index}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[rgba(255,244,230,0.74)]"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              ) : null}
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
            ) : !activePet ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-6 py-10 text-center">
                <div className="text-lg font-bold text-white">No companion available</div>
                <p className="mt-2 max-w-md text-sm leading-7 text-[rgba(255,244,230,0.72)]">
                  Create or sync a pet first, then come back to chat with the correct avatar and pet binding.
                </p>
                <Link
                  href="/create-pet"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffb020,#f97316)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_32px_rgba(249,115,22,0.28)] transition hover:brightness-105"
                >
                  Create Pet
                </Link>
              </div>
            ) : SafeChatPlayground ? (
              <SafeChatPlayground
                key={activePet.id}
                petId={usingDemoPets ? undefined : activePet.id}
                petName={activePet.name}
                petImageUrl={activePet.imageUrl}
                initialMessages={activePet.initialMessages}
                initialRemainingLabel={activePet.initialRemainingLabel}
                initialMemorySummary={activePet.initialMemorySummary}
              />
            ) : (
              <div className="flex min-h-[520px] flex-col justify-center rounded-[24px] border border-red-400/25 bg-red-500/10 px-6 py-10 text-center">
                <div className="text-lg font-bold text-red-100">
                  ChatPlayground component unavailable
                </div>
                <p className="mt-2 text-sm leading-7 text-red-50/90">
                  Check <code>components/chat-playground.tsx</code> export. It should expose a
                  named export called <code>ChatPlayground</code>.
                </p>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
