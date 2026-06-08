import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChatPlayground } from '@/components/chat-playground';
import { SiteHeader } from '@/components/site-header';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;
type ChatPageProps = {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
};

function pickFirst(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

function PetAvatar({
  src,
  name,
  className = 'h-14 w-14',
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} rounded-2xl object-cover ring-1 ring-white/10`}
      />
    );
  }

  return (
    <div
      className={`${className} inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300/20 to-orange-500/20 text-lg font-black text-amber-200 ring-1 ring-white/10`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please%20configure%20Supabase%20environment%20variables%20first.');
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const petIdFromQuery = pickFirst(resolvedSearchParams.petId);

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please%20log%20in%20to%20continue.');
  }

  const petOverview = await getPetsForUser(user.id);
  const pets = petOverview?.pets ?? [];

  if (!pets.length) {
    redirect('/create-pet?message=Create%20your%20first%20pet%20to%20start%20chatting.');
  }

  const selectedPet =
    pets.find((pet) => pet.id === petIdFromQuery) ||
    pets.find((pet) => pet.id === petOverview?.defaultPetId) ||
    pets[0];

  const petImage =
    (selectedPet as any)?.image_url ??
    (selectedPet as any)?.imageUrl ??
    (selectedPet as any)?.photo_url ??
    (selectedPet as any)?.photoUrl ??
    null;

  const petDescription =
    (selectedPet as any)?.personality ||
    (selectedPet as any)?.breed ||
    'A warm, emotionally present companion ready to keep talking with you.';

  return (
    <div className='app-brand-backdrop'>
      <SiteHeader theme='dark' />

      <main className='container-shell py-6 md:py-8'>
        <section className='glass-card p-5 md:p-6'>
          <div className='eyebrow'>✦ Warm companion chat</div>

          <div className='mt-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-start gap-4'>
              <PetAvatar src={petImage} name={selectedPet.name} className='h-16 w-16' />

              <div>
                <h1 className='page-title text-
