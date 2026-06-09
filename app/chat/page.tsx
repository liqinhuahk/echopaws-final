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
    pets.find((pet) => String(pet.id) === String(petIdFromQuery)) ||
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
    'A warmer, calmer chat space designed to keep your companion emotionally front and center.';

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
                <h1 className='page-title text-[clamp(2.4rem,4vw,4rem)]'>Chat with {selectedPet.name}</h1>
                <p className='mt-3 max-w-2xl text-[0.98rem] leading-[1.9] text-[rgba(255,244,230,0.78)]'>
                  {petDescription}
                </p>

                <div className='mt-4 flex flex-wrap gap-2'>
                  <span className='tag-chip tag-chip--warm'>Companion chat</span>
                  <span className='tag-chip tag-chip--soft'>
                    {selectedPet.id === petOverview?.defaultPetId ? 'Primary Pet' : 'Companion'}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link href='/memories' className='subtle-button'>
                Open Memories
              </Link>
              <Link href='/pets' className='subtle-button'>
                Manage Pets
              </Link>
            </div>
          </div>
        </section>

        <section className='mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]'>
          <aside className='grid gap-5'>
            <section className='glass-card p-5'>
              <div className='eyebrow'>Pet switcher</div>
              <h2 className='section-title mt-4 text-xl'>Choose your companion</h2>

              <div className='mt-5 grid gap-3'>
                {pets.map((pet) => {
                  const itemImage =
                    (pet as any)?.image_url ??
                    (pet as any)?.imageUrl ??
                    (pet as any)?.photo_url ??
                    (pet as any)?.photoUrl ??
                    null;

                  const active = pet.id === selectedPet.id;

                  return (
                    <Link
                      key={pet.id}
                      href={`/chat?petId=${pet.id}`}
                      className={`rounded-2xl border px-4 py-3 transition ${
                        active
                          ? 'border-amber-300/20 bg-amber-400/8'
                          : 'border-white/8 bg-white/4 hover:bg-white/6'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <PetAvatar src={itemImage} name={pet.name} className='h-11 w-11' />
                        <div className='min-w-0'>
                          <div className='truncate text-sm font-bold text-[color:#fff7ed]'>{pet.name}</div>
                          <div className='text-xs text-[rgba(255,244,230,0.56)]'>
                            {pet.id === petOverview?.defaultPetId ? 'Primary pet' : 'Companion'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className='glass-card p-5'>
              <div className='eyebrow'>Companion mood</div>
              <h2 className='section-title mt-4 text-xl'>A softer place to chat</h2>
              <p className='mt-3 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
                Warm cream tones, gentler bubbles, and cleaner message focus help the conversation
                feel more personal, calm, and emotionally close.
              </p>
            </section>
          </aside>

          <section className='glass-card min-h-[640px] p-4 md:p-5'>
            <ChatPlayground
              petId={selectedPet.id}
              petName={selectedPet.name}
              petImage={petImage}
              initialMessages={[]}
              usageLabel='Companion chat'
            />
          </section>
        </section>
      </main>
    </div>
  );
}
