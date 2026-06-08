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
import { PetBreedSelect } from '@/components/pet-breed-select';
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

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value: string | null) {
  if (!value) return 'Not chatted yet';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'Not chatted yet';
  }
}

function inputClassName() {
  return 'w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-stone-500 outline-none transition focus:border-amber-300/35 focus:ring-4 focus:ring-amber-400/10';
}

function darkCardClassName(extra?: string) {
  return joinClasses(
    'rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_22px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl',
    extra
  );
}

function smallMetricCardClassName() {
  return 'rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl';
}

function PagePetAvatar({
  name,
  imageUrl,
  size = 'md',
}: {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClass =
    size === 'sm'
      ? 'h-12 w-12 rounded-[18px] text-sm'
      : size === 'lg'
        ? 'h-24 w-24 rounded-[26px] text-2xl'
        : size === 'xl'
          ? 'h-28 w-28 rounded-[28px] text-3xl'
          : 'h-16 w-16 rounded-[22px] text-lg';

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

function statLabelClassName() {
  return 'text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400';
}

function badgeClassName(active = false) {
  return active
    ? 'inline-flex items-center rounded-full border border-amber-300/18 bg-amber-300/12 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-200'
    : 'inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-300';
}

export default async function PetsPage({
  searchParams,
}: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  noStore();

  const resolvedParams = searchParams ? await Promise.resolve(searchParams) : {};
  const successMessage = pickFirst(resolvedParams?.message).trim();
  const errorMessage = pickFirst(resolvedParams?.error).trim();

  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please+configure+Supabase+environment+variables+first.');
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
    redirect('/login?message=Please+sign+in+first+to+manage+your+pets.');
  }

  const [data, accessState] = await Promise.all([
    getPetsForUser(user.id),
    getChatAccessState(user.id),
  ]);

  const requestedPetId =
    pickFirst(resolvedParams?.pet_id).trim() ||
    pickFirst(resolvedParams?.petId).trim();

  const selectedPet =
    data.pets.find((pet) => pet.id === requestedPetId) ||
    data.pets.find((pet) => pet.id === data.latestActivePetId) ||
    data.pets.find((pet) => pet.id === data.defaultPetId) ||
    data.pets[0] ||
    null;

  const latestActivePet =
    data.pets.find((pet) => pet.id === data.latestActivePetId) || null;

  const isVip = accessState.vip;
  const freePlanCapReached = !isVip && data.pets.length >= FREE_TIER_MAX_PETS;
  const remainingPetSlots = Math.max(FREE_TIER_MAX_PETS - data.pets.length, 0);

  if (!selectedPet) {
    return (
      <div className='min-h-screen overflow-hidden bg-[#060504] text-[#f7efe5]'>
        <div className='pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,158,11,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_24%),linear-gradient(180deg,#0b0908_0%,#060504_48%,#050404_100%)]' />
        <div className='relative z-10 hidden md:block'>
          <SiteHeader theme='dark' ctaLabel='Create Pet' ctaHref='/create-pet' />
        </div>
        <main className='container-shell relative z-10 py-10'>
          <section className='rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,17,13,0.92),rgba(11,9,8,0.92))] p-8 shadow-[0_26px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl'>
            <div className='inline-flex items-center gap-2 rounded-full border border-amber-300/16 bg-amber-300/10 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-amber-200'>
              ✦ Pet Manager
            </div>
            <h1 className='mt-4 text-[clamp(2.2rem,4vw,4rem)] font-black tracking-[-0.05em] text-white'>
              Manage Your EchoPaws Companions
            </h1>
            <p className='mt-4 max-w-3xl text-sm leading-7 text-stone-300'>
              Create your first pet to unlock the full companion manager, profile editing, memory
              review, and synced chat workspace.
            </p>
            <div className='mt-6 flex flex-wrap gap-3'>
              <Link href='/create-pet' className='brand-button'>
                Create Your First Pet
              </Link>
              <Link href='/chat' className='subtle-button'>
                Open Chat
              </Link>
            </div>
          </section>
        </main>
        <div className='relative z-10'>
          <SiteFooter />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen overflow-hidden bg-[#060504] text-[#f7efe5]'>
      <div className='pointer-events-none fixed inset-0'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,158,11,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_24%),linear-gradient(180deg,#0b0908_0%,#060504_48%,#050404_100%)]' />
        <div className='absolute left-[-10%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-3xl' />
        <div className='absolute right-[-8%] top-[16%] h-[24rem] w-[24rem] rounded-full bg-amber-300/8 blur-3xl' />
      </div>

      <div className='relative z-10 hidden md:block'>
        <SiteHeader
          theme='dark'
          ctaLabel={freePlanCapReached ? 'Upgrade to VIP' : 'Create Pet'}
          ctaHref={freePlanCapReached ? '/pricing' : '/create-pet'}
        />
      </div>

      <FloatingToast message={successMessage || null} tone='success' />
      <FloatingToast message={errorMessage || null} tone='error' />

      <main className='container-shell relative z-10 py-8'>
        <section className='rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,17,13,0.92),rgba(11,9,8,0.92))] p-6 shadow-[0_26px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-8'>
          <div className='inline-flex items-center gap-2 rounded-full border border-amber-300/16 bg-amber-300/10 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-amber-200'>
            ✦ Pet Manager
          </div>

          <h1 className='mt-4 text-[clamp(2.2rem,4vw,4rem)] font-black tracking-[-0.05em] text-white'>
            Manage Your EchoPaws Companions
          </h1>

          <p className='mt-4 max-w-4xl text-sm leading-7 text-stone-300'>
            Same warm-dark visual language as Memories, with the pet list, active profile, and edit
            workspace all kept in sync with Chat.
          </p>

          <div className='mt-6 flex flex-wrap gap-3'>
            <Link
              href={freePlanCapReached ? '/pricing' : '/create-pet'}
              className='brand-button'
            >
              {freePlanCapReached ? 'Upgrade to VIP' : 'Add New Pet'}
            </Link>

            <Link
              href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`}
              className='subtle-button'
            >
              Open Current Pet Chat
            </Link>
          </div>
        </section>

        <section
          className={joinClasses(
            'mt-6 rounded-[30px] border px-5 py-5 text-sm leading-7 shadow-[0_20px_46px_rgba(0,0,0,0.24)] backdrop-blur-xl',
            isVip
              ? 'border-emerald-400/18 bg-emerald-400/10 text-emerald-200'
              : freePlanCapReached
                ? 'border-amber-300/18 bg-amber-300/10 text-amber-100'
                : 'border-sky-400/16 bg-sky-400/10 text-sky-100'
          )}
        >
          <div className='font-extrabold uppercase tracking-[0.14em]'>
            {isVip
              ? 'VIP Active'
              : freePlanCapReached
                ? 'Free Tier Pet Limit Reached'
                : 'Free Tier Pet Capacity'}
          </div>
          <div className='mt-2'>
            {isVip
              ? 'VIP is active. This account is not limited by the free-tier 2-pet cap.'
              : freePlanCapReached
                ? `Your free account already has ${data.pets.length} pets. Free tier supports up to ${FREE_TIER_MAX_PETS} pets.`
                : `You currently have ${data.pets.length} pets. You can still add ${remainingPetSlots} more before reaching the free-tier cap.`}
          </div>
        </section>

        <section className='mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <div className={smallMetricCardClassName()}>
            <div className={statLabelClassName()}>Total Pets</div>
            <div className='mt-2 text-3xl font-extrabold text-white'>{data.pets.length}</div>
            <p className='mt-2 text-sm leading-7 text-stone-300'>
              Companions currently managed in this workspace.
            </p>
          </div>

          <div className={smallMetricCardClassName()}>
            <div className={statLabelClassName()}>Total Memories</div>
            <div className='mt-2 text-3xl font-extrabold text-white'>{data.totalMemories}</div>
            <p className='mt-2 text-sm leading-7 text-stone-300'>
              Saved memory entries across all pets.
            </p>
          </div>

          <div className={smallMetricCardClassName()}>
            <div className={statLabelClassName()}>Total Conversations</div>
            <div className='mt-2 text-3xl font-extrabold text-white'>
              {data.totalConversations}
            </div>
            <p className='mt-2 text-sm leading-7 text-stone-300'>
              Tracks how often each companion is active over time.
            </p>
          </div>

          <div className={smallMetricCardClassName()}>
            <div className={statLabelClassName()}>
              {isVip ? 'Plan Status' : 'Free Slots Left'}
            </div>
            <div className='mt-2 text-3xl font-extrabold text-white'>
              {isVip ? 'VIP' : remainingPetSlots}
            </div>
            <p className='mt-2 text-sm leading-7 text-stone-300'>
              {isVip
                ? 'VIP removes the pet cap.'
                : `Free tier supports up to ${FREE_TIER_MAX_PETS} pets.`}
            </p>
          </div>
        </section>

        <section className='mt-6 grid gap-6 xl:grid-cols-[320px_360px_minmax(0,1fr)] xl:items-start'>
          <aside className='grid gap-6 xl:sticky xl:top-24'>
            <section className={darkCardClassName()}>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <div className='text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/90'>
                    Companion List
                  </div>
                  <h2 className='mt-2 text-2xl font-extrabold text-white'>Pet List</h2>
                  <p className='mt-2 text-sm leading-7 text-stone-300'>
                    Select a pet and the profile + edit workspace will update instantly.
                  </p>
                </div>

                <span className={badgeClassName()}>
                  {data.pets.length} companion{data.pets.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className='mt-5 grid gap-3'>
                {data.pets.map((pet) => {
                  const active = pet.id === selectedPet.id;
                  const isPrimary = pet.id === data.defaultPetId;

                  return (
                    <Link
                      key={pet.id}
                      href={`/pets?pet_id=${encodeURIComponent(pet.id)}`}
                      className={joinClasses(
                        'rounded-[24px] border p-4 transition',
                        active
                          ? 'border-amber-300/18 bg-gradient-to-r from-amber-300/12 to-orange-400/10 shadow-[0_16px_32px_rgba(0,0,0,0.24)]'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]'
                      )}
                    >
                      <div className='flex items-start gap-3'>
                        <PagePetAvatar
                          name={pet.name}
                          imageUrl={pet.image_url}
                          size='sm'
                        />

                        <div className='min-w-0 flex-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <div className='truncate text-base font-extrabold text-white'>
                              {pet.name}
                            </div>
                            {isPrimary ? <span className={badgeClassName(true)}>Primary</span> : null}
                            {active ? <span className={badgeClassName(true)}>Selected</span> : null}
                          </div>

                          <div className='mt-1 text-xs text-stone-400'>
                            {pet.breed || 'Breed not set'}
                            {pet.personality ? ` · ${pet.personality}` : ''}
                          </div>

                          <div className='mt-3 grid grid-cols-2 gap-2 text-xs'>
                            <div className='rounded-2xl border border-white/8 bg-black/20 px-3 py-2'>
                              <div className='font-bold text-amber-200'>Memories</div>
                              <div className='mt-1 text-base font-extrabold text-white'>
                                {pet.memory_count}
                              </div>
                            </div>

                            <div className='rounded-2xl border border-white/8 bg-black/20 px-3 py-2'>
                              <div className='font-bold text-stone-300'>Chats</div>
                              <div className='mt-1 text-base font-extrabold text-white'>
                                {pet.conversation_count}
                              </div>
                            </div>
                          </div>

                          <div className='mt-3 text-xs leading-6 text-stone-400'>
                            <div>
                              <strong className='text-stone-200'>Last Chat:</strong>{' '}
                              {formatDate(pet.last_chat_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </aside>

          <section className='grid gap-6'>
            <section className={darkCardClassName()}>
              <div className='flex items-start gap-4'>
                <PagePetAvatar
                  name={selectedPet.name}
                  imageUrl={selectedPet.image_url}
                  size='lg'
                />

                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h2 className='text-3xl font-extrabold text-white'>{selectedPet.name}</h2>
                    {selectedPet.id === data.defaultPetId ? (
                      <span className={badgeClassName(true)}>Primary Pet</span>
                    ) : (
                      <span className={badgeClassName()}>Companion</span>
                    )}
                  </div>

                  <div className='mt-2 text-sm text-stone-300'>
                    {selectedPet.breed || 'Breed not set'} ·{' '}
                    {selectedPet.personality || 'Personality not set'}
                  </div>
                </div>
              </div>

              <div className='mt-5 grid gap-4'>
                <div className='rounded-[22px] border border-white/10 bg-black/20 px-4 py-4'>
                  <div className='text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200/90'>
                    Companionship Summary
                  </div>
                  <div className='mt-2 whitespace-pre-line text-sm leading-7 text-stone-200'>
                    {selectedPet.summary || 'No companionship summary yet.'}
                  </div>
                </div>

                <div className='rounded-[22px] border border-white/10 bg-black/20 px-4 py-4'>
                  <div className='text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200/90'>
                    Lifestyle Info
                  </div>
                  <div className='mt-2 text-sm leading-7 text-stone-200'>
                    <strong className='text-white'>Loves:</strong>{' '}
                    {selectedPet.favorite_food || 'Not set yet'}
                    <br />
                    <strong className='text-white'>Daily Habits:</strong>{' '}
                    {selectedPet.daily_habits || 'Not set yet'}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div className='rounded-[22px] border border-white/10 bg-black/20 px-4 py-4'>
                    <div className={statLabelClassName()}>Memories</div>
                    <div className='mt-2 text-2xl font-extrabold text-white'>
                      {selectedPet.memory_count}
                    </div>
                  </div>

                  <div className='rounded-[22px] border border-white/10 bg-black/20 px-4 py-4'>
                    <div className={statLabelClassName()}>Chats</div>
                    <div className='mt-2 text-2xl font-extrabold text-white'>
                      {selectedPet.conversation_count}
                    </div>
                  </div>

                  <div className='rounded-[22px] border border-white/10 bg-black/20 px-4 py-4'>
                    <div className={statLabelClassName()}>Created</div>
                    <div className='mt-2 text-sm font-semibold text-stone-200'>
                      {formatDate(selectedPet.created_at)}
                    </div>
                  </div>

                  <div className='rounded-[22px] border border-white/10 bg-black/20 px-4 py-4'>
                    <div className={statLabelClassName()}>Last Chat</div>
                    <div className='mt-2 text-sm font-semibold text-stone-200'>
                      {formatDate(selectedPet.last_chat_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className='mt-5 grid gap-3'>
                <Link
                  href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`}
                  className='brand-button w-full text-center'
                >
                  Chat with This Pet
                </Link>

                <Link
                  href={`/memories?pet_id=${encodeURIComponent(selectedPet.id)}`}
                  className='subtle-button w-full text-center'
                >
                  View This Pet Memories
                </Link>

                {data.defaultPetId !== selectedPet.id ? (
                  <form action={setDefaultPetAction}>
                    <input type='hidden' name='petId' value={selectedPet.id} />
                    <button className='subtle-button w-full'>Set as Primary Pet</button>
                  </form>
                ) : (
                  <div className='rounded-2xl border border-emerald-400/18 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200'>
                    This is your primary pet and stays fixed at the top.
                  </div>
                )}
              </div>
            </section>

            <section className={darkCardClassName()}>
              <h3 className='text-xl font-extrabold text-white'>Quick Context</h3>

              <div className='mt-4 grid gap-3'>
                <div className='rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-stone-200'>
                  <strong className='text-white'>Most Active Pet:</strong>{' '}
                  {latestActivePet?.name || 'Not chatted yet'}
                  <div className='mt-1 text-xs text-stone-400'>
                    {latestActivePet?.last_chat_at
                      ? `Last interaction: ${formatDate(latestActivePet.last_chat_at)}`
                      : 'Start chatting and this will show your most recently active pet.'}
                  </div>
                </div>

                <div className='rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-stone-200'>
                  This page now uses the same dark-warm background direction as Memories, so moving
                  between Chat, Memories, and Pets feels visually continuous.
                </div>
              </div>
            </section>
          </section>

          <section className='grid gap-6'>
            <section className={darkCardClassName('p-6')}>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <h2 className='text-2xl font-extrabold text-white'>Edit Pet Profile</h2>
                  <p className='mt-2 text-sm leading-7 text-stone-300'>
                    Update name, breed, personality, preferences, and habits. Uploading a new image
                    replaces the current avatar. Leaving the field empty keeps the existing photo.
                  </p>
                </div>

                <div className='hidden md:block'>
                  <PagePetAvatar
                    name={selectedPet.name}
                    imageUrl={selectedPet.image_url}
                    size='md'
                  />
                </div>
              </div>

              <form
                action={updatePetAction}
                className='mt-6 grid gap-4'
                encType='multipart/form-data'
              >
                <input type='hidden' name='petId' value={selectedPet.id} />

                <div className='rounded-[24px] border border-white/10 bg-black/20 p-4'>
                  <div className='text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200/90'>
                    Current Avatar
                  </div>

                  <div className='mt-3 flex items-center gap-4'>
                    <PagePetAvatar
                      name={selectedPet.name}
                      imageUrl={selectedPet.image_url}
                      size='lg'
                    />
                    <div className='text-sm leading-7 text-stone-300'>
                      <div className='font-bold text-white'>{selectedPet.name}</div>
                      <div>{selectedPet.breed || 'Breed not set'}</div>
                      <div className='text-stone-400'>
                        This preview is locked to a square crop so the avatar no longer appears as a
                        narrow strip.
                      </div>
                    </div>
                  </div>
                </div>

                <label className='grid gap-2 text-sm font-bold text-stone-100'>
                  Name
                  <input
                    className={inputClassName()}
                    name='name'
                    type='text'
                    required
                    maxLength={30}
                    defaultValue={selectedPet.name}
                  />
                </label>

                <label className='grid gap-2 text-sm font-bold text-stone-100'>
                  Breed
                  <div className='rounded-2xl border border-white/12 bg-black/30 p-1'>
                    <PetBreedSelect defaultValue={selectedPet.breed || 'Other'} />
                  </div>
                </label>

                <label className='grid gap-2 text-sm font-bold text-stone-100'>
                  Personality
                  <input
                    className={inputClassName()}
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
                    className={inputClassName()}
                    name='favoriteFood'
                    type='text'
                    maxLength={120}
                    defaultValue={selectedPet.favorite_food || ''}
                  />
                </label>

                <label className='grid gap-2 text-sm font-bold text-stone-100'>
                  Daily Habits
                  <textarea
                    className={joinClasses(inputClassName(), 'min-h-[120px] resize-y')}
                    name='dailyHabits'
                    maxLength={500}
                    defaultValue={selectedPet.daily_habits || ''}
                  />
                </label>

                <label className='grid gap-2 text-sm font-bold text-stone-100'>
                  Change Photo
                  <div className='rounded-[24px] border border-dashed border-amber-300/28 bg-amber-300/8 px-6 py-6 text-center'>
                    <p className='text-sm font-bold text-amber-100'>
                      Leave empty to keep the current photo. Upload a new one to replace the avatar.
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
                    className='subtle-button text-center'
                  >
                    Preview Chat
                  </Link>
                </div>
              </form>
            </section>

            <section className='rounded-[30px] border border-rose-400/18 bg-rose-400/10 p-5 shadow-[0_22px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl'>
              <h3 className='text-xl font-extrabold text-rose-100'>Danger Zone</h3>
              <p className='mt-2 text-sm leading-7 text-rose-50/90'>
                Deleting this pet also removes related chat history, memory summary, and saved
                memories. If this is the current primary pet, another remaining pet will become
                primary automatically.
              </p>

              <form action={deletePetAction} className='mt-4'>
                <input type='hidden' name='petId' value={selectedPet.id} />
                <button className='rounded-full border border-rose-300/25 bg-white/10 px-5 py-3 text-sm font-bold text-rose-100 transition hover:bg-white/14'>
                  Delete This Pet
                </button>
              </form>
            </section>
          </section>
        </section>
      </main>

      <div className='relative z-10'>
        <SiteFooter />
      </div>
    </div>
  );
}
