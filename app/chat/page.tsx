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
    'A warmer, calmer chat space designed to keep your companion emotionally front and center.'
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

  const initialRemainingLabel =
    (petOverview as any)?.remainingLabel ||
    (petOverview as any)?.usageLabel ||
    (petOverview as any)?.chatAllowanceLabel ||
    'Companion chat';

  return (
    <div className='app-brand-backdrop min-h-screen bg-[#0c0706] text-[#fff7ed]'>
      <SiteHeader theme='dark' />

      <main className='container-shell pt-24 pb-8 md:pt-28 md:pb-10'>
        <script
          id='mobile-chat-pets-data'
          type='application/json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(mobileChatPetsPayload),
          }}
        />

        {/* Top banner */}
        <section className='glass-card relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))] p-6 md:p-7'>
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(249,115,22,0.14),transparent_28%),radial-gradient(circle_at_right_center,rgba(251,191,36,0.08),transparent_24%)]' />

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
                  <h1 className='page-title text-[clamp(2.35rem,4vw,4.2rem)] leading-[0.95] text-[#fff7ed]'>
                    Chat with {selectedPet.name}
                  </h1>

                  <p className='mt-3 max-w-2xl text-[0.96rem] leading-[1.85] text-[rgba(255,244,230,0.86)]'>
                    {petDescription}
                  </p>

                  <div className='mt-4 flex flex-wrap gap-2'>
                    <span className='tag-chip tag-chip--warm'>{initialRemainingLabel}</span>
                    <span className='tag-chip tag-chip--soft'>
                      {isPrimaryPet ? 'Primary Pet' : 'Companion'}
                    </span>
                    <span className='tag-chip tag-chip--soft'>Noir live</span>
                  </div>
                </div>
              </div>

              <div className='flex shrink-0 flex-col gap-3'>
                <Link
                  href={`/memories?pet_id=${selectedPet.id}`}
                  className='inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/22 bg-white/[0.04] px-5 text-sm font-bold text-[#fff7ed] transition hover:bg-white/[0.08]'
                >
                  Open Memories
                </Link>
                <Link
                  href='/pets'
                  className='inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/22 bg-white/[0.04] px-5 text-sm font-bold text-[#fff7ed] transition hover:bg-white/[0.08]'
                >
                  Manage Pets
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section className='mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]'>
          {/* Left rail */}
          <aside className='grid gap-5'>
            <section className='glass-card rounded-[28px] border border-white/10 p-5'>
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
                          : 'border-white/10 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]',
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
                          <div className='text-xs text-[rgba(255,244,230,0.72)]'>
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

            <section className='glass-card rounded-[28px] border border-white/10 p-5'>
              <div className='text-[0.64rem] font-extrabold uppercase tracking-[0.24em] text-[#f3c86b]'>
                Companion mood
              </div>

              <h3 className='mt-3 text-[1.9rem] font-black leading-[1.02] tracking-[-0.04em] text-[#fff7ed]'>
                A softer place to chat
              </h3>

              <p className='mt-4 text-sm leading-7 text-[rgba(255,244,230,0.82)]'>
                Warm cream tones, gentler bubbles, and clearer message focus help the conversation
                feel more personal, calm, and emotionally close.
              </p>

              <div className='mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
                {(selectedPet as any)?.breed ? `${(selectedPet as any).breed} · ` : ''}
                {(selectedPet as any)?.personality || 'Best for reunion-style chats, memory prompts, and cozy daily check-ins.'}
              </div>
            </section>
          </aside>

          {/* Right chat frame */}
          <section className='glass-card flex min-h-[640px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(18,10,8,0.92)] p-4 md:p-5'>
            <div className='min-h-0 flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(15,8,7,0.94)]'>
              <ChatPlayground
                petId={String(selectedPet.id)}
                petName={selectedPet.name}
                petImageUrl={petImage}
                initialMessages={[]}
                initialRemainingLabel={initialRemainingLabel}
                initialMemorySummary={petDescription}
              />
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
