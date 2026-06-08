import Link from 'next/link';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import {
  deletePetAction,
  setDefaultPetAction,
  updatePetAction,
} from '@/app/actions/pets';
import { EnglishFileUpload } from '@/components/english-file-upload';
import { FloatingToast } from '@/components/floating-toast';
import { FormSubmitButton } from '@/components/form-submit-button';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getChatAccessState } from '@/lib/chat-access';
import { getPetsForUser } from '@/lib/pets';
import {
  createServerSupabaseClient,
  hasSupabaseEnv,
} from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FREE_TIER_MAX_PETS = 2;

type SearchValue = string | string[] | undefined;

type PetsPageProps = {
  searchParams?:
    | Promise<{
        pet_id?: SearchValue;
        petId?: SearchValue;
        message?: SearchValue;
        error?: SearchValue;
      }>
    | {
        pet_id?: SearchValue;
        petId?: SearchValue;
        message?: SearchValue;
        error?: SearchValue;
      };
};

function pickFirst(value: SearchValue) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function formatDate(value: string | null) {
  if (!value) return 'Not chatted yet';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildPetsHref(petId: string, message?: string, error?: string) {
  const search = new URLSearchParams();
  search.set('pet_id', petId);
  if (message) search.set('message', message);
  if (error) search.set('error', error);
  return `/pets?${search.toString()}`;
}

function panelClassName() {
  return 'rounded-[28px] border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur-xl';
}

function badgeClassName(active = false) {
  return active
    ? 'inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-200'
    : 'inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-200';
}

function metricCardClassName() {
  return 'rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10';
}

function fieldClassName() {
  return [
    'w-full rounded-2xl border border-white/10 bg-[#16110e] px-4 py-3.5',
    'text-sm text-white placeholder:text-stone-500',
    'outline-none transition',
    'focus:border-amber-300/40 focus:bg-[#1b1511] focus:ring-4 focus:ring-amber-400/10',
  ].join(' ');
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
      ? 'h-20 w-20 rounded-[22px]'
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

export default async function PetsPage({ searchParams }: PetsPageProps) {
  noStore();

  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : {};

  const message = pickFirst(resolvedSearchParams.message).trim();
  const error = pickFirst(resolvedSearchParams.error).trim();
  const requestedPetId = (
    pickFirst(resolvedSearchParams.pet_id) ||
    pickFirst(resolvedSearchParams.petId)
  ).trim();

  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please%20configure%20Supabase%20environment%20variables%20first.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please%20sign%20in%20first%20to%20manage%20your%20pets.');
  }

  const [data, accessState] = await Promise.all([
    getPetsForUser(user.id),
    getChatAccessState(user.id),
  ]);

  const selectedPetId =
    requestedPetId ||
    data.latestActivePetId ||
    data.defaultPetId ||
    data.pets[0]?.id ||
    null;

  const selectedPet =
    data.pets.find((pet) => pet.id === selectedPetId) || data.pets[0] || null;

  const latestActivePet =
    data.pets.find((pet) => pet.id === data.latestActivePetId) || null;

  const isVip = accessState.vip;
  const freePlanCapReached = !isVip && data.pets.length >= FREE_TIER_MAX_PETS;
  const remainingPetSlots = Math.max(FREE_TIER_MAX_PETS - data.pets.length, 0);

  return (
    <div className='min-h-screen bg-black text-white'>
      <div className='relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-stone-950 via-[#120d0a] to-black'>
        <div className='pointer-events-none absolute inset-0 opacity-50'>
          <div className='absolute left-[-12%] top-[-8%] h-80 w-80 rounded-full bg-orange-500/12 blur-3xl' />
          <div className='absolute right-[-8%] top-[8%] h-96 w-96 rounded-full bg-amber-300/8 blur-3xl' />
          <div className='absolute bottom-[-14%] left-[18%] h-[26rem] w-[26rem] rounded-full bg-rose-500/8 blur-3xl' />
        </div>

        <div className='relative z-10 hidden md:block'>
          <SiteHeader
            theme='dark'
            ctaLabel={freePlanCapReached ? 'Upgrade to VIP' : 'Create New Pet'}
            ctaHref={freePlanCapReached ? '/pricing' : '/create-pet'}
          />
        </div>

        <FloatingToast message={message || null} tone='success' />
        <FloatingToast message={error || null} tone='error' />

        <main className='container-shell relative z-10 py-8 md:py-10'>
          <div className='mx-auto max-w-7xl'>
            <section className='mb-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-xl'>
              <div className='bg-gradient-to-r from-white/7 via-white/4 to-transparent px-6 py-6 md:px-7 md:py-7'>
                <div className='inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.24em] text-amber-200'>
                  ✦ Pet Manager
                </div>

                <h1 className='mt-4 text-4xl font-black tracking-tight text-white md:text-6xl'>
                  Manage Your EchoPaws Companions
                </h1>

                <p className='mt-4 max-w-4xl text-sm leading-7 text-stone-300 md:text-base'>
                  A unified multi-pet workspace for switching companions,
                  checking summaries, editing profiles, and keeping the current
                  pet in sync with Chat, Memories, and Account.
                </p>

                <div className='mt-6 flex flex-wrap gap-3'>
                  <Link
                    href={freePlanCapReached ? '/pricing' : '/create-pet'}
                    className='inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 px-5 text-sm font-extrabold text-stone-950 shadow-lg shadow-orange-900/20 transition hover:brightness-105'
                  >
                    {freePlanCapReached ? 'Upgrade to VIP' : 'Add New Pet'}
                  </Link>

                  {selectedPet ? (
                    <Link
                      href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`}
                      className='inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-sm font-bold text-white transition hover:bg-white/10'
                    >
                      Open Current Pet Chat
                    </Link>
                  ) : (
                    <Link
                      href='/chat'
                      className='inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-sm font-bold text-white transition hover:bg-white/10'
                    >
                      Open Chat
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {isVip ? (
              <div className='mb-6 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm leading-7 text-emerald-200'>
                <div className='font-extrabold uppercase tracking-[0.16em] text-emerald-100'>
                  VIP Active
                </div>
                <div className='mt-2'>
                  Your account is currently on <strong>VIP</strong>. This
                  manager is optimized for handling multiple pets, and your
                  account is not limited by the Free-tier 2-pet cap.
                </div>
              </div>
            ) : freePlanCapReached ? (
              <div className='mb-6 rounded-[24px] border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm leading-7 text-amber-100'>
                <div className='font-extrabold uppercase tracking-[0.16em] text-amber-200'>
                  Free Tier Pet Limit Reached
                </div>
                <div className='mt-2'>
                  Your Free account already has <strong>{data.pets.length}</strong>{' '}
                  pets. Free tier supports up to{' '}
                  <strong>{FREE_TIER_MAX_PETS}</strong> pets.
                </div>
              </div>
            ) : (
              <div className='mb-6 rounded-[24px] border border-sky-400/20 bg-sky-400/10 px-5 py-4 text-sm leading-7 text-sky-100'>
                <div className='font-extrabold uppercase tracking-[0.16em] text-sky-200'>
                  Free Tier Pet Capacity
                </div>
                <div className='mt-2'>
                  You currently have <strong>{data.pets.length}</strong> pet
                  {data.pets.length !== 1 ? 's' : ''}. You can still create{' '}
                  <strong>{remainingPetSlots}</strong> more before reaching the
                  free-tier limit.
                </div>
              </div>
            )}

            <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <div className={metricCardClassName()}>
                <div className='text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400'>
                  Total Pets
                </div>
                <div className='mt-3 text-4xl font-black text-white'>
                  {data.pets.length}
                </div>
                <div className='mt-2 text-sm leading-7 text-stone-400'>
                  You currently manage {data.pets.length} companion
                  {data.pets.length !== 1 ? 's' : ''}.
                </div>
              </div>

              <div className={metricCardClassName()}>
                <div className='text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400'>
                  Total Memories
                </div>
                <div className='mt-3 text-4xl font-black text-white'>
                  {data.totalMemories}
                </div>
                <div className='mt-2 text-sm leading-7 text-stone-400'>
                  Memories accumulated across pets and used to improve long-term
                  emotional continuity.
                </div>
              </div>

              <div className={metricCardClassName()}>
                <div className='text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400'>
                  Total Conversations
                </div>
                <div className='mt-3 text-4xl font-black text-white'>
                  {data.totalConversations}
                </div>
                <div className='mt-2 text-sm leading-7 text-stone-400'>
                  Tracks how frequently each companion is interacted with over
                  time.
                </div>
              </div>

              <div className={metricCardClassName()}>
                <div className='text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400'>
                  {isVip ? 'Plan Status' : 'Free Slots Left'}
                </div>
                <div className='mt-3 text-4xl font-black text-white'>
                  {isVip ? 'VIP' : remainingPetSlots}
                </div>
                <div className='mt-2 text-sm leading-7 text-stone-400'>
                  {isVip
                    ? 'VIP removes the free-tier pet cap and supports a larger multi-pet workspace.'
                    : `Free tier supports up to ${FREE_TIER_MAX_PETS} pets.`}
                </div>
              </div>
            </section>

            {!selectedPet ? (
              <section className={`${panelClassName()} mt-8 p-8 text-center`}>
                <h2 className='text-2xl font-black text-white'>
                  No pets created yet
                </h2>
                <p className='mx-auto mt-3 max-w-2xl text-sm leading-7 text-stone-300'>
                  Create your first AI pet and this page becomes your pet
                  management workspace for summaries, memory tracking, and
                  profile updates.
                </p>
                <div className='mt-6 flex justify-center gap-3'>
                  <Link
                    href='/create-pet'
                    className='inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 px-5 text-sm font-extrabold text-stone-950 shadow-lg shadow-orange-900/20 transition hover:brightness-105'
                  >
                    Create Your First Pet
                  </Link>
                  <Link
                    href='/chat'
                    className='inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-sm font-bold text-white transition hover:bg-white/10'
                  >
                    Open Chat
                  </Link>
                </div>
              </section>
            ) : (
              <section className='mt-8 grid gap-6 xl:grid-cols-[320px_380px_minmax(0,1fr)] xl:items-start'>
                <aside className='grid gap-5 xl:sticky xl:top-24'>
                  <section className={`${panelClassName()} p-5`}>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-200'>
                          Companion List
                        </div>
                        <h2 className='mt-2 text-2xl font-black tracking-tight text-white'>
                          Pet List
                        </h2>
                        <p className='mt-2 text-sm leading-7 text-stone-400'>
                          Select a pet from the list. The profile and edit panel
                          on the right update immediately for the chosen
                          companion.
                        </p>
                      </div>

                      <span className={badgeClassName()}>
                        {data.pets.length} companion{data.pets.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className='mt-5 grid gap-3 xl:max-h-[calc(100vh-260px)] xl:overflow-y-auto xl:pr-1'>
                      {data.pets.map((pet, index) => {
                        const active = pet.id === selectedPet.id;
                        const isPrimary = pet.id === data.defaultPetId;

                        return (
                          <Link
                            key={pet.id}
                            href={buildPetsHref(pet.id)}
                            className={
                              active
                                ? 'rounded-[24px] border border-amber-300/20 bg-gradient-to-r from-amber-300/10 to-orange-400/8 p-4 shadow-lg shadow-black/20 transition'
                                : 'rounded-[24px] border border-white/10 bg-white/4 p-4 transition hover:bg-white/7 hover:border-white/15'
                            }
                          >
                            <div className='flex items-start gap-3'>
                              <PetAvatar
                                name={pet.name}
                                imageUrl={pet.image_url}
                                size='md'
                              />

                              <div className='min-w-0 flex-1'>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <div className='truncate text-base font-extrabold text-white'>
                                    {pet.name}
                                  </div>

                                  {isPrimary ? (
                                    <span className={badgeClassName(true)}>
                                      Primary
                                    </span>
                                  ) : null}

                                  {active ? (
                                    <span className={badgeClassName()}>
                                      Selected
                                    </span>
                                  ) : null}

                                  <span className={badgeClassName()}>
                                    #{index + 1}
                                  </span>
                                </div>

                                <div className='mt-1 text-xs text-stone-400'>
                                  {pet.breed || 'Breed not set'}
                                  {pet.personality ? ` · ${pet.personality}` : ''}
                                </div>

                                <div className='mt-3 grid grid-cols-2 gap-2 text-xs'>
                                  <div className='rounded-2xl border border-white/8 bg-white/5 px-3 py-2'>
                                    <div className='font-bold text-amber-200'>
                                      Memories
                                    </div>
                                    <div className='mt-1 text-base font-extrabold text-white'>
                                      {pet.memory_count}
                                    </div>
                                  </div>

                                  <div className='rounded-2xl border border-white/8 bg-white/5 px-3 py-2'>
                                    <div className='font-bold text-stone-300'>
                                      Chats
                                    </div>
                                    <div className='mt-1 text-base font-extrabold text-white'>
                                      {pet.conversation_count}
                                    </div>
                                  </div>
                                </div>

                                <div className='mt-3 text-xs leading-6 text-stone-400'>
                                  <div>
                                    <strong className='text-stone-300'>
                                      Last Chat:
                                    </strong>{' '}
                                    {formatDate(pet.last_chat_at)}
                                  </div>
                                  <div>
                                    <strong className='text-stone-300'>
                                      Order:
                                    </strong>{' '}
                                    {isPrimary
                                      ? 'Primary pet fixed at top'
                                      : 'Sorted by recent activity'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    <div className='mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm leading-7 text-stone-300'>
                      {isVip ? (
                        <>VIP is active. This workspace is ready for managing multiple pets.</>
                      ) : (
                        <>
                          Free tier supports up to <strong>{FREE_TIER_MAX_PETS} pets</strong>. You currently have{' '}
                          <strong>{data.pets.length}</strong>.{' '}
                          {freePlanCapReached
                            ? 'Upgrade to VIP if you want to add more companions.'
                            : `You can still add ${remainingPetSlots} more.`}
                        </>
                      )}
                    </div>
                  </section>
                </aside>

                <div className='grid gap-5'>
                  <section className={`${panelClassName()} p-5`}>
                    <div className='flex items-start gap-4'>
                      <PetAvatar
                        name={selectedPet.name}
                        imageUrl={selectedPet.image_url}
                        size='lg'
                      />

                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <h3 className='text-2xl font-black text-white'>
                            {selectedPet.name}
                          </h3>

                          {data.defaultPetId === selectedPet.id ? (
                            <span className={badgeClassName(true)}>Primary Pet</span>
                          ) : (
                            <span className={badgeClassName()}>Companion</span>
                          )}
                        </div>

                        <p className='mt-2 text-sm leading-7 text-stone-300'>
                          {(selectedPet.breed || 'Breed not set') +
                            ' · ' +
                            (selectedPet.personality || 'Personality not set')}
                        </p>
                      </div>
                    </div>

                    <div className='mt-5 grid gap-4'>
                      <div>
                        <div className='text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-200'>
                          Companionship Summary
                        </div>
                        <div className='mt-2 rounded-[20px] border border-white/8 bg-white/4 px-4 py-4 text-sm leading-7 text-stone-300'>
                          <div className='whitespace-pre-line'>
                            {selectedPet.summary ||
                              'No companionship summary yet.'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className='text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-200'>
                          Lifestyle Info
                        </div>
                        <div className='mt-2 rounded-[20px] border border-white/8 bg-white/4 px-4 py-4 text-sm leading-7 text-stone-300'>
                          <strong className='text-white'>Loves:</strong>{' '}
                          {selectedPet.favorite_food || 'Not set yet'}
                          <br />
                          <strong className='text-white'>Habit:</strong>{' '}
                          {selectedPet.daily_habits || 'Not set yet'}
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-3'>
                        <div className='rounded-[20px] border border-white/8 bg-white/4 px-4 py-4'>
                          <div className='text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400'>
                            Memories
                          </div>
                          <div className='mt-2 text-2xl font-black text-white'>
                            {selectedPet.memory_count}
                          </div>
                        </div>

                        <div className='rounded-[20px] border border-white/8 bg-white/4 px-4 py-4'>
                          <div className='text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400'>
                            Chats
                          </div>
                          <div className='mt-2 text-2xl font-black text-white'>
                            {selectedPet.conversation_count}
                          </div>
                        </div>

                        <div className='rounded-[20px] border border-white/8 bg-white/4 px-4 py-4'>
                          <div className='text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400'>
                            Created
                          </div>
                          <div className='mt-2 text-sm font-semibold text-stone-200'>
                            {formatDate(selectedPet.created_at)}
                          </div>
                        </div>

                        <div className='rounded-[20px] border border-white/8 bg-white/4 px-4 py-4'>
                          <div className='text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400'>
                            Last Chat
                          </div>
                          <div className='mt-2 text-sm font-semibold text-stone-200'>
                            {formatDate(selectedPet.last_chat_at)}
                          </div>
                        </div>
                      </div>

                      <div className='grid gap-3'>
                        <Link
                          href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`}
                          className='inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 px-5 text-center text-sm font-extrabold text-stone-950 shadow-lg shadow-orange-900/20 transition hover:brightness-105'
                        >
                          Chat with This Pet
                        </Link>

                        <Link
                          href={`/memories?pet_id=${encodeURIComponent(selectedPet.id)}`}
                          className='inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-center text-sm font-bold text-white transition hover:bg-white/10'
                        >
                          View This Pet Memories
                        </Link>

                        {data.defaultPetId !== selectedPet.id ? (
                          <form action={setDefaultPetAction}>
                            <input type='hidden' name='petId' value={selectedPet.id} />
                            <button className='inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-sm font-bold text-white transition hover:bg-white/10'>
                              Set as Primary Pet
                            </button>
                          </form>
                        ) : (
                          <div className='rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-7 text-emerald-200'>
                            This is your primary pet and it stays fixed at the top.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className={`${panelClassName()} p-5`}>
                    <h3 className='text-xl font-extrabold text-white'>Quick Context</h3>

                    <div className='mt-4 grid gap-3'>
                      <div className='rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm leading-7 text-stone-300'>
                        <strong className='text-white'>Most Active Pet:</strong>{' '}
                        {latestActivePet?.name || 'Not chatted yet'}
                        <div className='mt-1 text-xs text-stone-400'>
                          {latestActivePet?.last_chat_at
                            ? `Last interaction: ${formatDate(latestActivePet.last_chat_at)}`
                            : 'Start chatting and this will show your most recently active pet.'}
                        </div>
                      </div>

                      <div className='rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm leading-7 text-stone-300'>
                        <strong className='text-white'>
                          Why this layout works better:
                        </strong>
                        <div className='mt-1 text-stone-400'>
                          The pet list stays compact and scrollable, while the
                          selected pet summary and edit form remain in the primary
                          workspace instead of being pushed far below.
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className='grid gap-6'>
                  <section className={`${panelClassName()} p-5`}>
                    <div className='flex items-start gap-4'>
                      <PetAvatar
                        name={selectedPet.name}
                        imageUrl={selectedPet.image_url}
                        size='lg'
                      />
                      <div>
                        <h3 className='text-2xl font-black text-white'>
                          Edit Pet Profile
                        </h3>
                        <p className='mt-2 text-sm leading-7 text-stone-300'>
                          Update name, breed, personality, preferences, and daily
                          habits. Uploading a new image will replace the current
                          avatar. Leaving the image field empty keeps the existing
                          photo.
                        </p>
                      </div>
                    </div>

                    <form action={updatePetAction} className='mt-5 grid gap-5'>
                      <input type='hidden' name='petId' value={selectedPet.id} />

                      <label className='grid gap-2 text-sm font-bold text-stone-100'>
                        Name
                        <input
                          className={fieldClassName()}
                          name='name'
                          type='text'
                          required
                          maxLength={30}
                          defaultValue={selectedPet.name}
                        />
                      </label>

                      <label className='grid gap-2 text-sm font-bold text-stone-100'>
                        Breed
                        <input
                          className={fieldClassName()}
                          name='breed'
                          type='text'
                          required
                          maxLength={30}
                          defaultValue={selectedPet.breed || ''}
                        />
                      </label>

                      <label className='grid gap-2 text-sm font-bold text-stone-100'>
                        Personality
                        <input
                          className={fieldClassName()}
                          name='personality'
                          type='text'
                          required
                          maxLength={120}
                          defaultValue={selectedPet.personality || ''}
                        />
                      </label>

                      <label className='grid gap-2 text-sm font-bold text-stone-100'>
                        Favorite Food
                        <input
                          className={fieldClassName()}
                          name='favoriteFood'
                          type='text'
                          maxLength={120}
                          defaultValue={selectedPet.favorite_food || ''}
                        />
                      </label>

                      <label className='grid gap-2 text-sm font-bold text-stone-100'>
                        Daily Habits
                        <textarea
                          className={`${fieldClassName()} min-h-[120px]`}
                          name='dailyHabits'
                          maxLength={500}
                          defaultValue={selectedPet.daily_habits || ''}
                        />
                      </label>

                      <label className='grid gap-2 text-sm font-bold text-stone-100'>
                        Change Photo
                        <div className='rounded-[22px] border border-dashed border-amber-300/20 bg-gradient-to-b from-amber-300/6 to-white/4 px-6 py-6 text-center text-stone-200'>
                          <p className='text-sm font-bold'>
                            Leave empty to keep the current photo. Upload a new one
                            to replace the avatar.
                          </p>
                          <p className='mt-1 text-xs font-normal text-stone-400'>
                            Supports JPG / PNG / WebP, max 5MB
                          </p>
                          <div className='mt-4'>
                            <EnglishFileUpload
                              name='image'
                              accept='image/png,image/jpeg,image/webp'
                            />
                          </div>
                        </div>
                      </label>

                      <div className='grid gap-3 md:grid-cols-2'>
                        <FormSubmitButton pendingLabel='Updating pet info...'>
                          Save Changes
                        </FormSubmitButton>

                        <Link
                          href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`}
                          className='inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-center text-sm font-bold text-white transition hover:bg-white/10'
                        >
                          Preview Chat
                        </Link>
                      </div>
                    </form>
                  </section>

                  <section className='rounded-[28px] border border-rose-400/20 bg-rose-400/10 p-5 shadow-xl shadow-black/20 backdrop-blur-xl'>
                    <h3 className='text-xl font-extrabold text-rose-100'>
                      Danger Zone
                    </h3>
                    <p className='mt-3 text-sm leading-7 text-rose-100/90'>
                      Deleting this pet will also remove its related chat history,
                      memory summary, and saved memories. If this pet is currently
                      primary, another remaining pet will become the new primary
                      automatically.
                    </p>

                    <form action={deletePetAction} className='mt-5'>
                      <input type='hidden' name='petId' value={selectedPet.id} />
                      <button className='inline-flex min-h-11 items-center justify-center rounded-full bg-rose-500 px-5 text-sm font-extrabold text-white transition hover:bg-rose-600'>
                        Delete This Pet
                      </button>
                    </form>
                  </section>
                </div>
              </section>
            )}
          </div>
        </main>

        <div className='relative z-10'>
          <SiteFooter text='© 2026 EchoPaws.ai. Noir pet manager workspace.' />
        </div>
      </div>
    </div>
  );
}
