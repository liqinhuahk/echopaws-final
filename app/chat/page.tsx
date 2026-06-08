import Link from 'next/link';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { ChatPlayground } from '@/components/chat-playground';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { getChatAccessStatus } from '@/lib/chat-access';
import { getPetsForUser } from '@/lib/pets';
import {
  createServerSupabaseClient,
  hasSupabaseEnv,
} from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SearchValue = string | string[] | undefined;

type ChatPageProps = {
  searchParams?:
    | Promise<{
        pet_id?: SearchValue;
        petId?: SearchValue;
        pet_created?: SearchValue;
        pet_name?: SearchValue;
        message?: SearchValue;
      }>
    | {
        pet_id?: SearchValue;
        petId?: SearchValue;
        pet_created?: SearchValue;
        pet_name?: SearchValue;
        message?: SearchValue;
      };
};

function pickFirst(value: SearchValue) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function badgeClassName(active = false) {
  return active
    ? 'inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-200'
    : 'inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-200';
}

function panelClassName() {
  return 'rounded-[28px] border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur-xl';
}

function petLinkClassName(active: boolean) {
  return active
    ? 'flex items-center gap-3 rounded-[22px] border border-amber-300/20 bg-gradient-to-r from-amber-300/10 to-orange-400/8 px-3.5 py-3.5 shadow-lg shadow-black/20'
    : 'flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/4 px-3.5 py-3.5 transition hover:bg-white/7 hover:border-white/15';
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
      ? 'h-12 w-12 rounded-[16px]'
      : size === 'lg'
      ? 'h-20 w-20 rounded-[24px]'
      : 'h-14 w-14 rounded-[18px]';

  return imageUrl ? (
    <div
      className={`overflow-hidden border border-white/10 bg-white/5 shadow-lg shadow-black/25 ${sizeClass}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={name} className='h-full w-full object-cover' />
    </div>
  ) : (
    <div
      className={`flex items-center justify-center border border-white/10 bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-lg font-black text-stone-950 shadow-lg shadow-orange-900/30 ${sizeClass}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  noStore();

  const resolvedParams = searchParams
    ? await Promise.resolve(searchParams)
    : {};

  const requestedPetId = (
    pickFirst(resolvedParams.pet_id) || pickFirst(resolvedParams.petId)
  ).trim();

  const petCreated = pickFirst(resolvedParams.pet_created).trim() === '1';
  const createdPetName = pickFirst(resolvedParams.pet_name).trim();
  const pageMessage = pickFirst(resolvedParams.message).trim();

  if (!hasSupabaseEnv()) {
    redirect('/login');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [petOverview, usageResult] = await Promise.all([
    getPetsForUser(user.id).catch(() => ({
      pets: [],
      defaultPetId: null,
      latestActivePetId: null,
      totalMemories: 0,
      totalConversations: 0,
    })),
    getChatAccessStatus(user.id).catch(() => null),
  ]);

  const pets = petOverview?.pets ?? [];

  if (!pets.length) {
    redirect('/create-pet');
  }

  const selectedPetId =
    requestedPetId ||
    petOverview.latestActivePetId ||
    petOverview.defaultPetId ||
    pets[0]?.id ||
    null;

  const selectedPet =
    pets.find((pet) => pet.id === selectedPetId) || pets[0];

  const { data: messagesData } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('pet_id', selectedPet.id)
    .order('created_at', { ascending: true })
    .limit(100);

  const initialMessages =
    messagesData?.length
      ? messagesData.map((m) => ({
          role: m.role,
          content: m.content,
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

  const moodHeading = selectedPet.personality
    ? `${selectedPet.name} feels ${selectedPet.personality.toLowerCase()}`
    : 'Warm, emotionally present, softly attentive';

  const shortProfile = [
    selectedPet.breed ? selectedPet.breed : null,
    selectedPet.favorite_food ? `loves ${selectedPet.favorite_food}` : null,
    selectedPet.daily_habits ? selectedPet.daily_habits : null,
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
            pets: pets.map((p) => ({
              id: p.id,
              name: p.name,
              imageUrl: p.image_url,
              href: `/chat?pet_id=${p.id}`,
            })),
          }),
        }}
      />

      <div className='min-h-screen bg-black text-white'>
        <div className='relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-stone-950 via-[#120d0a] to-black'>
          <div className='pointer-events-none absolute inset-0 opacity-50'>
            <div className='absolute left-[-12%] top-[-8%] h-80 w-80 rounded-full bg-orange-500/12 blur-3xl' />
            <div className='absolute right-[-8%] top-[8%] h-96 w-96 rounded-full bg-amber-300/8 blur-3xl' />
            <div className='absolute bottom-[-14%] left-[18%] h-[26rem] w-[26rem] rounded-full bg-rose-500/8 blur-3xl' />
          </div>

          <div className='relative z-10 hidden md:block'>
            <SiteHeader theme='dark' />
          </div>

          <main className='container-shell relative z-10 py-6 md:py-8'>
            <div className='mx-auto max-w-7xl'>
              {(petCreated || pageMessage) && (
                <div className='mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200'>
                  {pageMessage ||
                    `${createdPetName || selectedPet.name} has been created successfully. Your new companion chat is ready.`}
                </div>
              )}

              <section className='mb-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-xl'>
                <div className='bg-gradient-to-r from-white/7 via-white/4 to-transparent px-6 py-6 md:px-7 md:py-7'>
                  <div className='inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.24em] text-amber-200'>
                    ✦ Warm Companion Chat
                  </div>

                  <div className='mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
                    <div className='flex items-start gap-4'>
                      <PetAvatar
                        name={selectedPet.name}
                        imageUrl={selectedPet.image_url}
                        size='lg'
                      />

                      <div className='min-w-0'>
                        <h1 className='text-3xl font-black tracking-tight text-white md:text-5xl'>
                          Chat with {selectedPet.name}
                        </h1>

                        <p className='mt-3 max-w-3xl text-sm leading-7 text-stone-300 md:text-base'>
                          A softer, darker, more intimate chat space — designed
                          to keep your companion emotionally front and center in
                          the Noir experience.
                        </p>

                        <div className='mt-4 flex flex-wrap gap-2'>
                          <span className={badgeClassName(true)}>
                            {usageLabel}
                          </span>
                          <span className={badgeClassName()}>
                            {selectedPet.id === petOverview.defaultPetId
                              ? 'Primary Pet'
                              : 'Companion'}
                          </span>
                          <span className={badgeClassName()}>Noir Live</span>
                        </div>
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-3'>
                      <Link
                        href={`/memories?pet_id=${encodeURIComponent(selectedPet.id)}`}
                        className='inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 text-sm font-bold text-white transition hover:bg-white/10'
                      >
                        Memories
                      </Link>

                      <Link
                        href={`/pets?pet_id=${encodeURIComponent(selectedPet.id)}`}
                        className='inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 text-sm font-bold text-white transition hover:bg-white/10'
                      >
                        Manage Pets
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
                <aside className='space-y-5'>
                  <section className={`${panelClassName()} p-5`}>
                    <div className='text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-200'>
                      Pet Switcher
                    </div>

                    <h2 className='mt-2 text-2xl font-black tracking-tight text-white'>
                      Choose your companion
                    </h2>

                    <div className='mt-4 space-y-3'>
                      {pets.map((pet) => {
                        const active = pet.id === selectedPet.id;
                        const isPrimary = pet.id === petOverview.defaultPetId;

                        return (
                          <Link
                            key={pet.id}
                            href={`/chat?pet_id=${encodeURIComponent(pet.id)}`}
                            className={petLinkClassName(active)}
                          >
                            <PetAvatar
                              name={pet.name}
                              imageUrl={pet.image_url}
                              size='sm'
                            />

                            <div className='min-w-0 flex-1'>
                              <div
                                className={`truncate text-sm font-bold ${
                                  active ? 'text-white' : 'text-stone-200'
                                }`}
                              >
                                {pet.name}
                              </div>

                              <div
                                className={`mt-0.5 truncate text-xs ${
                                  active ? 'text-amber-200' : 'text-stone-400'
                                }`}
                              >
                                {isPrimary ? 'Primary pet' : 'Companion'}
                              </div>
                            </div>

                            {active ? (
                              <span className={badgeClassName(true)}>Live</span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </section>

                  <section className={`${panelClassName()} p-5`}>
                    <div className='text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-200'>
                      Companion Mood
                    </div>

                    <h3 className='mt-2 text-2xl font-black tracking-tight text-white'>
                      {moodHeading}
                    </h3>

                    <p className='mt-3 text-sm leading-7 text-stone-300'>
                      This Noir chat space keeps the tone calmer, deeper, and
                      more emotionally connected, while preserving the selected
                      pet and its memory context.
                    </p>

                    <div className='mt-4 rounded-[22px] border border-white/8 bg-white/4 px-4 py-4 text-sm leading-7 text-stone-300'>
                      {shortProfile ||
                        'Keep chatting to build more personality and memory details for this companion.'}
                    </div>

                    <div className='mt-4 grid gap-3'>
                      <div className='rounded-[20px] border border-white/8 bg-white/4 px-4 py-3 text-sm text-stone-300'>
                        Best for reunion-style chats, memory prompts, and cozy
                        daily check-ins.
                      </div>

                      <div className='rounded-[20px] border border-white/8 bg-white/4 px-4 py-3 text-sm text-stone-300'>
                        Switching pets preserves the current{' '}
                        <span className='font-bold text-amber-200'>pet_id</span>{' '}
                        and keeps Chat / Pets / Memories aligned.
                      </div>
                    </div>
                  </section>
                </aside>

                <section className='min-w-0'>
                  <div className='rounded-[30px] border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-5'>
                    <div className='rounded-[26px] border border-white/10 bg-gradient-to-b from-[#17110d] to-[#0d0907] p-2 md:p-3'>
                      <ChatPlayground
                        key={selectedPet.id}
                        petId={selectedPet.id}
                        petName={selectedPet.name}
                        petImageUrl={selectedPet.image_url}
                        initialMessages={initialMessages}
                        initialRemainingLabel={usageLabel}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>

          <div className='relative z-10'>
            <SiteFooter text='© 2026 EchoPaws.ai. Noir companion chat workspace.' />
          </div>
        </div>
      </div>
    </>
  );
}
