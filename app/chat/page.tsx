import Link from 'next/link';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { ChatPlayground } from '@/components/chat-playground';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getChatAccessStatus } from '@/lib/chat-access';
import { getPetsForUser } from '@/lib/pets';
import {
  createServerSupabaseClient,
  hasSupabaseEnv,
} from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function PetAvatar({
  name,
  imageUrl,
  size = 'md',
}: {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'sm'
      ? 'h-11 w-11 rounded-2xl text-sm'
      : size === 'lg'
        ? 'h-20 w-20 rounded-[24px] text-2xl'
        : 'h-14 w-14 rounded-[20px] text-lg';

  if (imageUrl) {
    return (
      <div
        className={joinClasses(
          'shrink-0 overflow-hidden border border-white/12 bg-white/5 shadow-[0_14px_30px_rgba(0,0,0,0.34)]',
          sizeClass
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`${name} avatar`} className='h-full w-full object-cover' />
      </div>
    );
  }

  return (
    <div
      className={joinClasses(
        'grid shrink-0 place-items-center border border-white/12 bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 font-black text-stone-950 shadow-[0_14px_30px_rgba(249,115,22,0.28)]',
        sizeClass
      )}
      aria-label={`${name} avatar placeholder`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function badgeClassName(active = false) {
  return active
    ? 'inline-flex items-center rounded-full border border-amber-300/18 bg-amber-300/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200'
    : 'inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-300';
}

function petLinkClassName(active: boolean) {
  return active
    ? 'flex items-center gap-3 rounded-[24px] border border-amber-300/18 bg-gradient-to-r from-amber-300/12 to-orange-400/10 px-3.5 py-3.5 shadow-[0_18px_34px_rgba(0,0,0,0.28)]'
    : 'flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] px-3.5 py-3.5 transition hover:border-white/14 hover:bg-white/[0.05]';
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  noStore();

  const resolvedParams = searchParams ? await Promise.resolve(searchParams) : {};

  const requestedPetId =
    pickFirst(resolvedParams?.pet_id).trim() ||
    pickFirst(resolvedParams?.petId).trim();

  const petCreated = pickFirst(resolvedParams?.pet_created).trim() === '1';
  const createdPetName = pickFirst(resolvedParams?.pet_name).trim();
  const pageMessage = pickFirst(resolvedParams?.message).trim();

  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please+configure+Supabase+first.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    redirect('/login?error=Unable+to+verify+your+session.+Please+sign+in+again.');
  }

  if (!user) {
    redirect('/login?message=Please+sign+in+first+to+open+chat.');
  }

  const [petOverview, usageResult] = await Promise.all([
    getPetsForUser(user.id).catch(() => ({
      pets: [],
      defaultPetId: null,
      latestActivePetId: null,
    })),
    getChatAccessStatus(user.id).catch(() => null),
  ]);

  const pets = petOverview?.pets ?? [];

  if (!pets.length) {
    redirect('/create-pet');
  }

  const selectedPet =
    pets.find((pet) => pet.id === requestedPetId) ||
    pets.find((pet) => pet.id === petOverview.latestActivePetId) ||
    pets.find((pet) => pet.id === petOverview.defaultPetId) ||
    pets[0];

  const { data: messagesData } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('pet_id', selectedPet.id)
    .order('created_at', { ascending: true })
    .limit(100);

  const initialMessages =
    messagesData?.length
      ? messagesData.map((message) => ({
          role: message.role,
          content: message.content,
        }))
      : [
          {
            role: 'assistant',
            content: `Hi, I'm ${selectedPet.name}. I'm so happy to see you!`,
          },
        ];

  const usageLabel = usageResult?.vip
    ? 'VIP — Unlimited'
    : `${usageResult?.remaining ?? 0} / 20 chats left`;

  const moodLine = selectedPet.personality
    ? `${selectedPet.name} feels ${selectedPet.personality.toLowerCase()}`
    : `${selectedPet.name} feels emotionally present`;

  const profileLine = [
    selectedPet.breed,
    selectedPet.favorite_food ? `loves ${selectedPet.favorite_food}` : '',
    selectedPet.daily_habits || '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <script
        id='mobile-chat-pets-data'
        type='application/json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            activePetId: selectedPet.id,
            pets: pets.map((pet) => ({
              id: pet.id,
              name: pet.name,
              imageUrl: pet.image_url,
              href: `/chat?pet_id=${pet.id}`,
            })),
          }),
        }}
      />

      <div className='min-h-screen overflow-hidden bg-[#060504] text-[#f7efe5]'>
        <div className='pointer-events-none fixed inset-0'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,158,11,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_24%),linear-gradient(180deg,#0b0908_0%,#060504_48%,#050404_100%)]' />
          <div className='absolute left-[-10%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-3xl' />
          <div className='absolute right-[-8%] top-[16%] h-[24rem] w-[24rem] rounded-full bg-amber-300/8 blur-3xl' />
        </div>

        <div className='relative z-10 hidden md:block'>
          <SiteHeader
            theme='dark'
            ctaLabel='Manage Pets'
            ctaHref={`/pets?pet_id=${encodeURIComponent(selectedPet.id)}`}
          />
        </div>

        <main className='container-shell relative z-10 py-8'>
          <section className='rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,17,13,0.92),rgba(11,9,8,0.92))] p-6 shadow-[0_26px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-8'>
            <div className='inline-flex items-center gap-2 rounded-full border border-amber-300/16 bg-amber-300/10 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-amber-200'>
              ✦ Warm Companion Chat
            </div>

            <div className='mt-5 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
              <div className='flex items-start gap-4'>
                <PetAvatar
                  name={selectedPet.name}
                  imageUrl={selectedPet.image_url}
                  size='lg'
                />

                <div className='min-w-0'>
                  <h1 className='text-[clamp(2.2rem,4vw,3.8rem)] font-black tracking-[-0.05em] text-white'>
                    Chat with {selectedPet.name}
                  </h1>

                  <p className='mt-3 max-w-3xl text-sm leading-7 text-stone-300'>
                    Softer dark tones, warmer contrast, and a calmer emotional focus — aligned with
                    the Memories experience so Chat feels like the same continuous companion space.
                  </p>

                  <div className='mt-4 flex flex-wrap items-center gap-2.5'>
                    <span className={badgeClassName(true)}>{usageLabel}</span>
                    <span className={badgeClassName(selectedPet.id === petOverview.defaultPetId)}>
                      {selectedPet.id === petOverview.defaultPetId ? 'Primary Pet' : 'Companion'}
                    </span>
                    <span className={badgeClassName()}>Noir Live</span>
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap gap-3'>
                <Link
                  href={`/memories?pet_id=${encodeURIComponent(selectedPet.id)}`}
                  className='subtle-button'
                >
                  Open Memories
                </Link>
                <Link
                  href={`/pets?pet_id=${encodeURIComponent(selectedPet.id)}`}
                  className='subtle-button'
                >
                  Manage Pets
                </Link>
              </div>
            </div>

            {(petCreated || pageMessage) && (
              <div className='mt-5 rounded-2xl border border-emerald-400/18 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200'>
                {pageMessage ||
                  `${createdPetName || selectedPet.name} has been created successfully. Your new chat is ready.`}
              </div>
            )}
          </section>

          <section className='mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
            <aside className='hidden space-y-5 xl:block'>
              <section className='rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_22px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl'>
                <div className='text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/90'>
                  Pet Switcher
                </div>
                <h2 className='mt-2 text-2xl font-extrabold text-white'>Choose your companion</h2>

                <div className='mt-4 grid gap-3'>
                  {pets.map((pet) => {
                    const active = pet.id === selectedPet.id;

                    return (
                      <Link
                        key={pet.id}
                        href={`/chat?pet_id=${encodeURIComponent(pet.id)}`}
                        className={petLinkClassName(active)}
                      >
                        <PetAvatar name={pet.name} imageUrl={pet.image_url} size='sm' />

                        <div className='min-w-0 flex-1'>
                          <div className='truncate text-sm font-extrabold text-white'>
                            {pet.name}
                          </div>
                          <div className='mt-1 text-xs text-stone-400'>
                            {pet.id === petOverview.defaultPetId ? 'Primary pet' : 'Companion'}
                          </div>
                        </div>

                        {active ? (
                          <span className='inline-flex items-center rounded-full border border-amber-300/18 bg-amber-300/12 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-200'>
                            Live
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </section>

              <section className='rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_22px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl'>
                <div className='text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/90'>
                  Companion Mood
                </div>
                <h3 className='mt-2 text-2xl font-extrabold text-white'>{moodLine}</h3>

                <p className='mt-3 text-sm leading-7 text-stone-300'>
                  This tone now follows the same dark-warm language used in Memories, so Chat,
                  Memories, and Pets feel like one connected space instead of three different
                  themes.
                </p>

                <div className='mt-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-stone-200'>
                  {profileLine || 'Profile details will appear here as you complete this pet profile.'}
                </div>
              </section>
            </aside>

            <section className='min-w-0 rounded-[30px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_24px_56px_rgba(0,0,0,0.3)] backdrop-blur-xl md:p-5'>
              <div className='rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,13,10,0.96),rgba(10,8,7,0.96))] p-2 md:p-3'>
                <ChatPlayground
                  key={selectedPet.id}
                  petId={selectedPet.id}
                  petName={selectedPet.name}
                  petImageUrl={selectedPet.image_url}
                  initialMessages={initialMessages}
                  initialRemainingLabel={usageLabel}
                />
              </div>
            </section>
          </section>
        </main>

        <div className='relative z-10'>
          <SiteFooter />
        </div>
      </div>
    </>
  );
}
