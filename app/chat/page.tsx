import { redirect } from 'next/navigation';
import ChatPageClient, { type ChatPagePet } from './chat-page-client';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;

type ChatPageProps = {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
};

function pickFirst(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

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

function getPetImage(pet: Record<string, any>) {
  return (
    pet?.image_url ??
    pet?.imageUrl ??
    pet?.photo_url ??
    pet?.photoUrl ??
    pet?.avatar_url ??
    pet?.avatarUrl ??
    pet?.profileImageUrl ??
    pet?.petImageUrl ??
    null
  );
}

function normalizeMessages(input: unknown, petName: string) {
  if (!Array.isArray(input)) {
    return [
      {
        role: 'assistant' as const,
        content: `Hi, I'm ${petName} 🐾 I'm here with you.`,
      },
    ];
  }

  const parsed = input
    .map((item: any) => {
      const role: 'user' | 'assistant' = item?.role === 'user' ? 'user' : 'assistant';
      const content = String(item?.content ?? item?.text ?? '').trim();
      if (!content) return null;
      return { role, content };
    })
    .filter(Boolean) as Array<{ role: 'user' | 'assistant'; content: string }>;

  if (parsed.length > 0) return parsed;

  return [
    {
      role: 'assistant' as const,
      content: `Hi, I'm ${petName} 🐾 I'm here with you.`,
    },
  ];
}

function normalizeNotes(input: unknown) {
  if (Array.isArray(input)) {
    const notes = input.map((item) => String(item).trim()).filter(Boolean);
    if (notes.length > 0) return notes;
  }

  if (typeof input === 'string' && input.trim()) {
    const notes = input
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    if (notes.length > 0) return notes;
  }

  return [
    'Warm, emotionally present, and designed for softer daily companionship.',
    'Built to feel calmer, clearer, and more personal than a generic chat UI.',
  ];
}

function normalizePet(
  raw: Record<string, any>,
  index: number,
  defaultPetId?: string | number | null
): ChatPagePet | null {
  const id = firstNonEmptyString(raw.id, raw.petId, raw._id, raw.uuid, raw.slug, raw.companionId);
  if (!id) return null;

  const name = firstNonEmptyString(raw.name, raw.petName, raw.title, `Pet ${index + 1}`);
  const imageUrl = getPetImage(raw);

  const vip = firstBoolean(raw.vip, raw.isVip, raw.pro) ?? true;
  const isPrimary =
    String(id) === String(defaultPetId ?? '') ||
    firstBoolean(raw.isPrimary, raw.primary) ||
    index === 0;

  const isLive =
    firstBoolean(raw.isLive, raw.live) ??
    String(raw.status ?? '').trim().toLowerCase() === 'live';

  const subtitle = firstNonEmptyString(
    raw.subtitle,
    raw.shortDescription,
    raw.personality,
    raw.description,
    raw.breed,
    'Always here to keep you company with warmth and emotional continuity.'
  );

  const moodTitle = firstNonEmptyString(
    raw.moodTitle,
    raw.chatMoodTitle,
    'Soft, present, emotionally warm'
  );

  const moodDescription = firstNonEmptyString(
    raw.moodDescription,
    raw.chatMoodDescription,
    'A calmer, warmer chat space designed to keep your companion emotionally front and center.'
  );

  return {
    id: String(id),
    name,
    roleLabel: firstNonEmptyString(raw.roleLabel, raw.type, raw.species, isPrimary ? 'Primary pet' : 'Companion'),
    imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl : null,
    subtitle,
    moodTitle,
    moodDescription,
    notes: normalizeNotes(raw.notes ?? raw.highlights ?? raw.moodNotes ?? raw.chatNotes),
    vip,
    isPrimary: Boolean(isPrimary),
    isLive: Boolean(isLive),
    initialMessages: normalizeMessages(raw.initialMessages ?? raw.messages, name),
    initialRemainingLabel: firstNonEmptyString(
      raw.initialRemainingLabel,
      raw.remainingLabel,
      raw.usageLabel,
      vip ? 'VIP — Unlimited Chat' : 'Companion Chat'
    ),
    initialMemorySummary: firstNonEmptyString(raw.initialMemorySummary, raw.memorySummary),
  };
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please%20configure%20Supabase%20environment%20variables%20first.');
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedPetId =
    pickFirst(resolvedSearchParams.pet_id) ?? pickFirst(resolvedSearchParams.petId);

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?message=Please%20log%20in%20to%20continue.&next=%2Fchat');
  }

  const petOverview = await getPetsForUser(user.id);
  const rawPets = Array.isArray(petOverview?.pets) ? petOverview.pets : [];

  if (!rawPets.length) {
    redirect('/create-pet?message=Create%20your%20first%20pet%20to%20start%20chatting.');
  }

  const normalizedPets = rawPets
    .map((pet: Record<string, any>, index: number) =>
      normalizePet(pet, index, petOverview?.defaultPetId)
    )
    .filter(Boolean) as ChatPagePet[];

  if (!normalizedPets.length) {
    redirect('/create-pet?message=Create%20your%20first%20pet%20to%20start%20chatting.');
  }

  const selectedPet =
    (requestedPetId &&
      normalizedPets.find((pet) => String(pet.id) === String(requestedPetId))) ||
    normalizedPets.find((pet) => pet.isPrimary) ||
    normalizedPets[0];

  return (
    <ChatPageClient
      initialPets={normalizedPets}
      initialSelectedPetId={selectedPet?.id ?? normalizedPets[0].id}
    />
  );
}
