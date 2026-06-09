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

function getPetImage(pet: any) {
  return (
    pet?.image_url ??
    pet?.imageUrl ??
    pet?.photo_url ??
    pet?.photoUrl ??
    pet?.avatar_url ??
    pet?.avatarUrl ??
    null
  );
}

function getPetDescription(pet: any) {
  return (
    pet?.personality ||
    pet?.description ||
    pet?.breed ||
    'A softer, darker, more intimate chat space designed to keep your companion emotionally front and center.'
  );
}

function PetAvatar({
  src,
  name,
  className = 'h-14 w-14',
  rounded = 'rounded-2xl',
}: {
  src?: string | null;
  name: string;
  className?: string;
  rounded?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} ${rounded} object-cover ring-1 ring-white/10`}
      />
    );
  }

  return (
    <div
      className={`${className} ${rounded} inline-flex items-center justify-center bg-gradient-to-br from-amber-300/25 to-orange-500/25 text-base font-black text-amber-100 ring-1 ring-white/10`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function buildMobileChatPetsPayload(
  pets: any[],
  selectedPetId: string | number,
  defaultPetId?: string | number | null,
) {
  return {
    activePetId: String(selectedPetId),
    pets: pets.map((pet) => ({
      id: String(pet.id),
      name: pet.name,
      imageUrl: getPetImage(pet),
      href: `/chat?petId=${pet.id}`,
      isPrimary: String(pet.id) === String(defaultPetId ?? ''),
    })),
  };
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please%20configure%20Supabase%20environment%20variables%20first.');
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const petIdFromQuery =
    pickFirst(resolvedSearchParams.petId) ?? pickFirst(resolvedSearchParams.pet_id);

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
    pets.find((pet) => String(pet.id) === String(petOverview?.defaultPetId ?? '')) ||
    pets[0];

  const petImage = getPetImage(selectedPet);
  const petDescription = getPetDescription(selectedPet);
  const isPrimaryPet =
    String(selectedPet.id) === String(petOverview?.defaultPetId ?? '');

  const mobileChatPetsPayload = buildMobileChatPetsPayload(
    pets,
    selectedPet.id,
    petOverview?.defaultPetId,
  );

  return (
    <div className='app-brand-backdrop min-h-screen bg-[#0c0706] text-[#fff7ed]'>
      <SiteHeader theme='dark' />

      <main className='container-shell py-6 md:py-8'>
        <script
          id='mobile-chat-pets-data'
          type='application/json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(mobileChatPetsPayload),
          }}
        />

        {/* Top hero card */}
        <section className='glass-card relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))] p-5 md:p-6'>
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(249,115,22,0.12),transparent_26%),radial-gradient(circle_at_right_center,rgba(251,191,36,0.07),transparent_22%)]' />

          <div className='relative z-10'>
            <div className='inline-flex items-center rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-[0.64rem] font-extrabold uppercase tracking-[0.22em] text-[#f6cf7b]'>
              ✦ Warm companion chat
            </div>

            <div className='mt-5 flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
              <div className='flex min-w-0 items-start gap-4'>
                <PetAvatar
                  src={petImage}
                  name={selectedPet.name}
                  className='h-16 w-16 md:h-[58px] md:w-[58px]'
                  rounded='rounded-2xl'
                />

                <div className='min-w-0'>
                  <h1 className='page-title text-[clamp(2.3rem,4vw,4rem)] leading-[0.95]'>
                    Chat with {selectedPet.name}
                  </h1>

                  <p className='mt-3 max-w-2xl text-[0.95rem] leading-[1.8] text-[rgba(255,244,230,0.78)]'>
                    {petDescription}
                  </p>

                  <div className='mt-4 flex flex-wrap gap-2'>
                    <span className='tag-chip tag-chip--warm'>Companion chat</span>
                    <span className='tag-chip tag-chip--soft'>
                      {isPrimaryPet ? 'Primary pet' : 'Companion'}
                    </span>
                    <span className='tag-chip tag-chip--soft'>Noir live</span>
                  </div>
                </div>
              </div>

              <div className='flex shrink-0 flex-row gap-3 md:flex-col'>
                <Link href='/memories' className='subtle-button text-center'>
                  Memories
                </Link>
                <Link href='/pets' className='subtle-button text-center'>
                  Manage Pets
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main 2-column chat area */}
        <section className='mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]'>
          {/* Left rail */}
          <aside className='grid gap-5'>
            <section className='glass-card rounded-[28px] border border-white/8 p-5'>
              <div className='text-[0.64rem] font-extrabold uppercase tracking-[0.24em] text-[#f3c86b]'>
                Pet switcher
              </div>

              <h2 className='mt-3 text-[1.9rem] font-black leading-none tracking-[-0.04em] text-[#fff7ed]'>
                Choose your companion
              </h2>

              <div className='mt-5 grid gap-3'>
                {pets.map((pet) => {
                  const itemImage = getPetImage(pet);
                  const active = String(pet.id) === String(selectedPet.id);
                  const primary =
                    String(pet.id) === String(petOverview?.defaultPetId ?? '');

                  return (
                    <Link
                      key={pet.id}
                      href={`/chat?petId=${pet.id}`}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'group rounded-[22px] border px-4 py-3 transition duration-200',
                        active
                          ? 'border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(249,115,22,0.08))] shadow-[0_10px_28px_rgba(249,115,22,0.14)]'
                          : 'border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]',
                      ].join(' ')}
                    >
                      <div className='flex items-center gap-3'>
                        <PetAvatar
                          src={itemImage}
                          name={pet.name}
                          className='h-11 w-11'
                          rounded='rounded-xl'
                        />

                        <div className='min-w-0 flex-1'>
                          <div className='truncate text-sm font-extrabold text-[#fff7ed]'>
                            {pet.name}
                          </div>
                          <div className='text-xs text-[rgba(255,244,230,0.60)]'>
                            {primary ? 'Primary pet' : 'Companion'}
                          </div>
                        </div>

                        {active ? (
                          <span className='inline-flex h-7 items-center rounded-full border border-amber-300/30 bg-amber-300/14 px-3 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-[#f6cf7b]'>
                            Live
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className='glass-card rounded-[28px] border border-white/8 p-5'>
              <div className='text-[0.64rem] font-extrabold uppercase tracking-[0.24em] text-[#f3c86b]'>
                Companion mood
              </div>

              <h3 className='mt-3 text-[1.9rem] font-black leading-[1.02] tracking-[-0.04em] text-[#fff7ed]'>
                {selectedPet.name} feels playful
              </h3>

              <p className='mt-4 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
                This Noir chat space keeps the tone calmer, deeper, and more emotionally connected,
                while preserving the selected pet and its memory context.
              </p>

              <div className='mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[rgba(255,244,230,0.74)]'>
                {(selectedPet as any)?.breed ? `${(selectedPet as any).breed} · ` : ''}
                {(selectedPet as any)?.personality || 'Warm, emotionally close, and memory-aware.'}
              </div>
            </section>
          </aside>

          {/* Right chat frame */}
          <section className='glass-card flex min-h-[640px] flex-col overflow-hidden rounded-[28px] border border-white/8 p-4 md:p-5'>
            <div className='mb-3 flex items-center justify-between gap-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='tag-chip tag-chip--warm'>Companion chat</span>
                <Link href='/memories' className='text-xs font-bold text-[rgba(255,244,230,0.78)] hover:text-white'>
                  Open Memories
                </Link>
              </div>
            </div>

            <div className='min-h-0 flex-1 overflow-hidden rounded-[24px] border border-white/6 bg-[rgba(8,5,4,0.55)]'>
              <div className='h-full min-h-0 overflow-hidden'>
                <ChatPlayground
                  petId={selectedPet.id}
                  petName={selectedPet.name}
                  petImage={petImage}
                  initialMessages={[]}
                  usageLabel='Companion chat'
                />
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
