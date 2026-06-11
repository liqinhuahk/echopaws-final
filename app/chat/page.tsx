import { redirect } from 'next/navigation';
import ChatPageClient from './chat-page-client';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPetsForUser } from '@/lib/pets';

type SearchParamsInput =
  | Promise<{ petId?: string | string[] | undefined }>
  | { petId?: string | string[] | undefined }
  | undefined;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type NormalizedPet = {
  id: string;
  name: string;
  imageUrl: string | null;
  subtitle: string;
  description: string;
  badges: string[];
  isPrimary: boolean;
  isLive: boolean;
  moodTitle: string;
  moodDescription: string;
  notes: string[];
  initialMessages: ChatMessage[];
  initialRemainingLabel: string;
  initialMemorySummary: string;
};

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function firstBoolean(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return false;
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function normalizeInitialMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (
        item &&
        typeof item === 'object' &&
        ((item as { role?: unknown }).role === 'user' ||
          (item as { role?: unknown }).role === 'assistant') &&
        typeof (item as { content?: unknown }).content === 'string'
      ) {
        return {
          role: (item as { role: 'user' | 'assistant' }).role,
          content: (item as { content: string }).content.trim(),
        };
      }
      return null;
    })
    .filter((item): item is ChatMessage => Boolean(item && item.content));
}

function extractPetArray(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;

  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;

    if (Array.isArray(obj.pets)) return obj.pets;
    if (Array.isArray(obj.data)) return obj.data;
    if (obj.data && typeof obj.data === 'object' && Array.isArray((obj.data as Record<string, unknown>).pets)) {
      return (obj.data as Record<string, unknown>).pets as unknown[];
    }
  }

  return [];
}

function normalizePet(raw: unknown, index: number): NormalizedPet | null {
  if (!raw || typeof raw !== 'object') return null;

  const pet = raw as Record<string, unknown>;

  const id = firstNonEmptyString(
    pet.id,
    pet.pet_id,
    pet.petId,
    pet.uuid,
    pet.companion_id,
    pet.companionId
  );

  const name = firstNonEmptyString(
    pet.name,
    pet.pet_name,
    pet.petName,
    pet.title
  );

  if (!id || !name) return null;

  const imageUrl =
    firstNonEmptyString(
      pet.image_url,
      pet.imageUrl,
      pet.photo_url,
      pet.photoUrl,
      pet.avatar_url,
      pet.avatarUrl,
      pet.profile_image_url,
      pet.profileImageUrl,
      pet.pet_image_url,
      pet.petImageUrl
    ) || null;

  const isPrimary = firstBoolean(
    pet.is_primary,
    pet.isPrimary,
    pet.primary,
    index === 0
  );

  const isLive = firstBoolean(
    pet.is_live,
    pet.isLive,
    pet.live,
    true
  );

  const subtitle = firstNonEmptyString(
    pet.role_label,
    pet.roleLabel,
    pet.subtitle,
    isPrimary ? 'Primary pet' : 'Companion'
  );

  const description = firstNonEmptyString(
    pet.description,
    pet.summary,
    pet.bio,
    pet.personality,
    `${name} is here to stay close, warm, and emotionally present.`
  );

  const moodTitle = firstNonEmptyString(
    pet.mood_title,
    pet.moodTitle,
    'Soft, present, emotionally warm'
  );

  const moodDescription = firstNonEmptyString(
    pet.mood_description,
    pet.moodDescription,
    'A calmer, warmer chat space designed to keep your companion emotionally front and center.'
  );

  const rawBadges = normalizeStringArray(pet.badges);
  const badges = rawBadges.length
    ? rawBadges
    : [
        isLive ? 'Real pet data' : 'Companion profile',
        firstNonEmptyString(pet.plan_label, pet.planLabel, isPrimary ? 'VIP — Unlimited Chat' : 'Companion chat'),
        isPrimary ? 'Primary pet' : 'Companion',
      ].filter(Boolean);

  const rawNotes = normalizeStringArray(
    Array.isArray(pet.notes)
      ? pet.notes
      : Array.isArray(pet.highlights)
        ? pet.highlights
        : Array.isArray(pet.personality_notes)
          ? pet.personality_notes
          : []
  );

  const notes = rawNotes.length
    ? rawNotes
    : [
        'Warm, emotionally present, and designed for softer daily companionship.',
        'Built to feel calmer, clearer, and more personal than a generic chat UI.',
      ];

  const initialMessages = normalizeInitialMessages(
    pet.initial_messages ?? pet.initialMessages ?? []
  );

  const initialRemainingLabel = firstNonEmptyString(
    pet.initial_remaining_label,
    pet.initialRemainingLabel,
    pet.remaining_label,
    pet.remainingLabel,
    isPrimary ? 'VIP — Unlimited Chat' : 'Companion chat'
  );

  const initialMemorySummary = firstNonEmptyString(
    pet.initial_memory_summary,
    pet.initialMemorySummary,
    pet.memory_summary,
    pet.memorySummary,
    ''
  );

  return {
    id,
    name,
    imageUrl,
    subtitle,
    description,
    badges,
    isPrimary,
    isLive,
    moodTitle,
    moodDescription,
    notes,
    initialMessages,
    initialRemainingLabel,
    initialMemorySummary,
  };
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const requestedPetId = Array.isArray(resolvedSearchParams.petId)
    ? resolvedSearchParams.petId[0]
    : resolvedSearchParams.petId;

  const nextHref = requestedPetId
    ? `/chat?petId=${encodeURIComponent(requestedPetId)}`
    : '/chat';

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextHref)}`);
  }

  const rawPets = await getPetsForUser(user.id);
  const pets = extractPetArray(rawPets)
    .map((item, index) => normalizePet(item, index))
    .filter((item): item is NormalizedPet => Boolean(item));

  const selectedPet =
    pets.find((pet) => pet.id === requestedPetId) ??
    pets.find((pet) => pet.isPrimary) ??
    pets[0];

  return (
    <ChatPageClient
      pets={pets}
      initialPetId={selectedPet?.id}
    />
  );
}
