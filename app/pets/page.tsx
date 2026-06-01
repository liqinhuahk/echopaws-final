import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  deletePetAction,
  setDefaultPetAction,
  updatePetAction,
} from '@/app/actions/pets';
import { FloatingToast } from '@/components/floating-toast';
import { FormSubmitButton } from '@/components/form-submit-button';
import { PetBreedSelect } from '@/components/pet-breed-select';
import {
  PetActionPanel,
  PetDangerZoneCard,
  PetEditFormCard,
  PetEmptyStateCard,
  PetNoticeBanner,
  PetPageHeroCard,
  PetSidebarProfileCard,
  PetStatsGrid,
  PetToolbarCard,
} from '@/components/pet-cards';
import {
  PetOrderBadge,
  PetOrderHint,
  PrimaryPetBadge,
  SelectedPetBadge,
} from '@/components/pet-ui-badges';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getChatAccessState } from '@/lib/chat-access';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

const FREE_TIER_MAX_PETS = 2;

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

export default async function PetsPage({
  searchParams,
}: {
  searchParams?: { pet_id?: string; message?: string; error?: string };
}) {
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
    searchParams?.pet_id || data.defaultPetId || data.pets[0]?.id || null;
  const selectedPet =
    data.pets.find((pet) => pet.id === selectedPetId) || data.pets[0] || null;
  const latestActivePet =
    data.pets.find((pet) => pet.id === data.latestActivePetId) || null;

  const isVip = accessState.vip;
  const freePlanCapReached = !isVip && data.pets.length >= FREE_TIER_MAX_PETS;
  const remainingPetSlots = Math.max(FREE_TIER_MAX_PETS - data.pets.length, 0);

  const heroActions = (
    <div className='flex flex-wrap gap-3'>
      <Link
        href={freePlanCapReached ? '/pricing' : '/create-pet'}
        className={freePlanCapReached ? 'brand-button' : 'brand-button'}
      >
        {freePlanCapReached ? 'Upgrade to VIP' : 'Add New Pet'}
      </Link>

      {selectedPet ? (
        <Link
          href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`}
          className='subtle-button'
        >
          Open Current Pet Chat
        </Link>
      ) : (
        <Link href='/chat' className='subtle-button'>
          Open Chat
        </Link>
      )}
    </div>
  );

  const planBanner = isVip ? (
    <div className='mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900'>
      <div className='font-extrabold uppercase tracking-[0.06em] text-emerald-800'>
        VIP Active
      </div>
      <div className='mt-2'>
        Your account is currently on <strong>VIP</strong>. This manager is optimized for
        handling multiple pets, and your account is not limited by the Free-tier{' '}
        <strong>{FREE_TIER_MAX_PETS}-pet</strong> cap.
      </div>
    </div>
  ) : freePlanCapReached ? (
    <div className='mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900'>
      <div className='font-extrabold uppercase tracking-[0.06em] text-orange-800'>
        Free Tier Pet Limit Reached
      </div>
      <div className='mt-2'>
        Your Free account already has <strong>{data.pets.length} AI pets</strong>. Free
        tier supports up to <strong>{FREE_TIER_MAX_PETS} pets</strong>.
      </div>
      <div className='mt-2'>
        To add another pet, delete one existing pet first, or upgrade to{' '}
        <strong>VIP</strong> to unlock more slots, unlimited conversations, and deeper
        memory continuity.
      </div>
      <div className='mt-4 flex flex-wrap gap-3'>
        <Link href='/pricing' className='brand-button'>
          Upgrade to VIP
        </Link>
        <Link href='/create-pet' className='subtle-button'>
          Open Create Pet
        </Link>
      </div>
    </div>
  ) : (
    <div className='mt-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm leading-7 text-sky-900'>
      <div className='font-extrabold uppercase tracking-[0.06em] text-sky-800'>
        Free Tier Pet Capacity
      </div>
      <div className='mt-2'>
        You currently have <strong>{data.pets.length}</strong> pet
        {data.pets.length !== 1 ? 's' : ''} on Free tier.
        {remainingPetSlots > 0 ? (
          <>
            {' '}
            You can still create <strong>{remainingPetSlots}</strong> more pet
            {remainingPetSlots !== 1 ? 's' : ''} before reaching the Free-tier limit of{' '}
            <strong>{FREE_TIER_MAX_PETS}</strong>.
          </>
        ) : null}
      </div>
      <div className='mt-2'>
        Need more than {FREE_TIER_MAX_PETS} pets?{' '}
        <Link
          href='/pricing'
          className='font-bold underline decoration-2 underline-offset-2'
        >
          Upgrade to VIP
        </Link>
        .
      </div>
    </div>
  );

  return (
    <>
      <div className='hidden md:block'>
        <SiteHeader
          ctaLabel={freePlanCapReached ? 'Upgrade to VIP' : 'Create New Pet'}
          ctaHref={freePlanCapReached ? '/pricing' : '/create-pet'}
        />
      </div>

      <FloatingToast message={searchParams?.message || null} tone='success' />
      <FloatingToast message={searchParams?.error || null} tone='error' />

      <main className='container-shell py-10'>
        <PetPageHeroCard
          eyebrow='Pet Manager'
          title='Manage Your EchoPaws Companions'
          description='A cleaner multi-pet workspace for switching pets, checking summaries, and editing profiles without excessive scrolling.'
          actions={heroActions}
        />

        {planBanner}

        <PetStatsGrid
          className='mt-8'
          columnsClassName='md:grid-cols-2 xl:grid-cols-4'
          items={[
            {
              label: 'Total Pets',
              value: data.pets.length,
              description: `You currently manage ${data.pets.length} companion${
                data.pets.length !== 1 ? 's' : ''
              }.`,
            },
            {
              label: 'Total Memories',
              value: data.totalMemories,
              description:
                'Memories accumulated across pets and used to improve long-term emotional continuity.',
            },
            {
              label: 'Total Conversations',
              value: data.totalConversations,
              description:
                'Tracks how frequently each companion is interacted with over time.',
            },
            {
              label: isVip ? 'Plan Status' : 'Free Slots Left',
              value: isVip ? 'VIP Active' : remainingPetSlots,
              valueClassName: 'mt-2 text-2xl font-extrabold tracking-tight',
              description: isVip
                ? 'VIP removes the Free-tier pet cap.'
                : `Free tier supports up to ${FREE_TIER_MAX_PETS} pets.`,
            },
          ]}
        />

        {!selectedPet ? (
          <PetEmptyStateCard
            className='mt-8'
            title='No pets created yet'
            description='Create your first AI pet and this page becomes your pet management workspace for summaries, memory tracking, and profile updates.'
            primaryAction={{ label: 'Create Your First Pet', href: '/create-pet' }}
            secondaryAction={{ label: 'Open Chat', href: '/chat', variant: 'secondary' }}
          />
        ) : (
          <section className='mt-8 grid gap-5 xl:grid-cols-[300px_360px_minmax(0,1fr)] xl:items-start'>
            <aside className='grid gap-5 xl:sticky xl:top-24'>
              <PetToolbarCard className='p-5'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div>
                    <h2 className='text-2xl font-extrabold'>Pet List</h2>
                    <p className='mt-2 text-sm leading-7 text-muted'>
                      Select a pet from the left. The summary and edit panel on the right
                      update immediately for the chosen companion.
                    </p>
                  </div>

                  <Link
                    href={freePlanCapReached ? '/pricing' : '/create-pet'}
                    className='subtle-button'
                  >
                    {freePlanCapReached ? 'Upgrade' : 'Add Pet'}
                  </Link>
                </div>

                <div className='mt-5 grid gap-3 xl:max-h-[calc(100vh-280px)] xl:overflow-y-auto xl:pr-1'>
                  {data.pets.map((pet, index) => {
                    const active = pet.id === selectedPet.id;
                    const isPrimary = pet.id === data.defaultPetId;

                    return (
                      <Link
                        key={pet.id}
                        href={`/pets?pet_id=${encodeURIComponent(pet.id)}`}
                        className={`rounded-[24px] border p-4 transition ${
                          active
                            ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm shadow-orange-100'
                            : 'border-black/5 bg-white hover:border-orange-200 hover:shadow-sm'
                        }`}
                      >
                        <div className='flex items-start gap-3'>
                          {pet.image_url ? (
                            <img
                              src={pet.image_url}
                              alt={`${pet.name} avatar`}
                              className='h-14 w-14 rounded-[18px] object-cover shadow-sm'
                            />
                          ) : (
                            <div className='grid h-14 w-14 place-items-center rounded-[18px] bg-stone-100 text-2xl shadow-sm'>
                              🐾
                            </div>
                          )}

                          <div className='min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <div className='truncate text-base font-extrabold text-slate-900'>
                                {pet.name}
                              </div>
                              <PrimaryPetBadge isPrimary={isPrimary} size='xs' />
                              <SelectedPetBadge show={active} size='xs' />
                              <PetOrderBadge rank={index + 1} />
                            </div>

                            <div className='mt-1 text-xs text-muted'>
                              {pet.breed || 'Breed not set'}
                              {pet.personality ? ` · ${pet.personality}` : ''}
                            </div>

                            <div className='mt-3 grid grid-cols-2 gap-2 text-xs'>
                              <div className='rounded-2xl bg-white/80 px-3 py-2'>
                                <div className='font-bold text-orange-800'>Memories</div>
                                <div className='mt-1 text-base font-extrabold text-slate-900'>
                                  {pet.memory_count}
                                </div>
                              </div>

                              <div className='rounded-2xl bg-white/80 px-3 py-2'>
                                <div className='font-bold text-slate-700'>Chats</div>
                                <div className='mt-1 text-base font-extrabold text-slate-900'>
                                  {pet.conversation_count}
                                </div>
                              </div>
                            </div>

                            <div className='mt-3 text-xs leading-6 text-muted'>
                              <div>
                                <strong className='text-slate-700'>Last Chat:</strong>{' '}
                                {formatDate(pet.last_chat_at)}
                              </div>
                              <div>
                                <strong className='text-slate-700'>Order:</strong>{' '}
                                <PetOrderHint
                                  isPrimary={isPrimary}
                                  className='text-xs text-muted'
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {!isVip ? (
                  <div className='mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-700'>
                    Free tier supports up to <strong>{FREE_TIER_MAX_PETS} pets</strong>. You
                    currently have <strong>{data.pets.length}</strong>.{' '}
                    {freePlanCapReached
                      ? 'Upgrade to VIP if you want to add more companions.'
                      : `You can still add ${remainingPetSlots} more.`}
                  </div>
                ) : (
                  <div className='mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800'>
                    VIP is active. This left panel is designed to scale better when you manage
                    multiple pets.
                  </div>
                )}
              </PetToolbarCard>
            </aside>

            <div className='grid gap-5'>
              <PetSidebarProfileCard
                name={selectedPet.name}
                imageUrl={selectedPet.image_url}
                subtitle={`${selectedPet.breed || 'Breed not set'} · ${
                  selectedPet.personality || 'Personality not set'
                }`}
                primary={data.defaultPetId === selectedPet.id}
                primaryLabelMode='detailed'
                orderHintText={`Ordering: ${
                  selectedPet.id === data.defaultPetId
                    ? 'Primary pet fixed at top'
                    : 'Sorted by recent activity'
                }`}
                sections={[
                  {
                    title: 'Companionship Summary',
                    content: (
                      <div className='whitespace-pre-line'>
                        {selectedPet.summary || 'No companionship summary yet.'}
                      </div>
                    ),
                    contentClassName:
                      'mt-2 whitespace-pre-line text-sm leading-7 text-slate-700',
                  },
                  {
                    title: 'Lifestyle Info',
                    content: (
                      <>
                        <strong>Loves:</strong> {selectedPet.favorite_food || 'Not set yet'}
                        <br />
                        <strong>Habit:</strong> {selectedPet.daily_habits || 'Not set yet'}
                      </>
                    ),
                  },
                  {
                    title: 'Plan Capacity',
                    content: isVip ? (
                      <>VIP active - this account is not limited by the Free-tier 2-pet cap.</>
                    ) : (
                      <>
                        Free tier supports up to {FREE_TIER_MAX_PETS} pets. You currently have{' '}
                        {data.pets.length}.{' '}
                        {freePlanCapReached
                          ? 'Upgrade to VIP if you want to add more.'
                          : `You can still add ${remainingPetSlots} more.`}
                      </>
                    ),
                    contentClassName: 'mt-2 text-sm leading-7 text-slate-700',
                  },
                ]}
                metrics={[
                  { label: 'Memories', value: selectedPet.memory_count },
                  { label: 'Chats', value: selectedPet.conversation_count },
                  {
                    label: 'Created',
                    value: formatDate(selectedPet.created_at),
                    valueClassName: 'mt-2 text-sm font-semibold text-slate-700',
                  },
                  {
                    label: 'Last Chat',
                    value: formatDate(selectedPet.last_chat_at),
                    valueClassName: 'mt-2 text-sm font-semibold text-slate-700',
                  },
                ]}
                metricsColumnsClassName='grid-cols-2'
                footer={
                  <PetActionPanel
                    items={[
                      {
                        key: 'chat',
                        label: 'Chat with This Pet',
                        href: `/chat?pet_id=${encodeURIComponent(selectedPet.id)}`,
                        variant: 'primary',
                      },
                      {
                        key: 'memories',
                        label: 'View This Pet Memories',
                        href: `/memories?pet_id=${encodeURIComponent(selectedPet.id)}`,
                        variant: 'secondary',
                      },
                      data.defaultPetId !== selectedPet.id
                        ? {
                            key: 'set-default',
                            node: (
                              <form action={setDefaultPetAction}>
                                <input type='hidden' name='petId' value={selectedPet.id} />
                                <button className='subtle-button w-full'>
                                  Set as Primary Pet
                                </button>
                              </form>
                            ),
                          }
                        : {
                            key: 'default-active',
                            node: (
                              <PetNoticeBanner tone='success'>
                                This is your primary pet and it stays fixed at the top.
                              </PetNoticeBanner>
                            ),
                          },
                    ]}
                  />
                }
              />

              <div className='glass-card p-5'>
                <h3 className='text-xl font-extrabold'>Quick Context</h3>
                <div className='mt-4 grid gap-3'>
                  <div className='rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm leading-7 text-slate-700'>
                    <strong className='text-slate-900'>Most Active Pet:</strong>{' '}
                    {latestActivePet?.name || 'Not chatted yet'}
                    <div className='mt-1 text-xs text-muted'>
                      {latestActivePet?.last_chat_at
                        ? `Last interaction: ${formatDate(latestActivePet.last_chat_at)}`
                        : 'Start chatting and this will show your most recently active pet.'}
                    </div>
                  </div>

                  <div className='rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm leading-7 text-slate-700'>
                    <strong className='text-slate-900'>Why this layout works better:</strong>
                    <div className='mt-1 text-muted'>
                      The pet list stays compact and scrollable, while the selected pet
                      summary and edit form remain in the primary workspace instead of being
                      pushed far below.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='grid gap-6'>
              <PetEditFormCard
                title='Edit Pet Profile'
                description='Update name, breed, personality, preferences, and habits. Uploading a new image will replace the current avatar. Leaving the image field empty keeps the existing photo.'
                action={updatePetAction}
                hiddenFields={<input type='hidden' name='petId' value={selectedPet.id} />}
                fields={
                  <>
                    <label className='grid gap-2 text-sm font-bold'>
                      Name
                      <input
                        className='input-shell'
                        name='name'
                        type='text'
                        required
                        maxLength={30}
                        defaultValue={selectedPet.name}
                      />
                    </label>

                    <label className='grid gap-2 text-sm font-bold'>
                      Breed
                      <PetBreedSelect defaultValue={selectedPet.breed || 'Other'} />
                    </label>

                    <label className='grid gap-2 text-sm font-bold'>
                      Personality
                      <input
                        className='input-shell'
                        name='personality'
                        type='text'
                        required
                        maxLength={120}
                        defaultValue={selectedPet.personality || ''}
                      />
                    </label>

                    <label className='grid gap-2 text-sm font-bold'>
                      Favorite Food
                      <input
                        className='input-shell'
                        name='favoriteFood'
                        type='text'
                        maxLength={120}
                        defaultValue={selectedPet.favorite_food || ''}
                      />
                    </label>

                    <label className='grid gap-2 text-sm font-bold'>
                      Daily Habits
                      <textarea
                        className='input-shell min-h-[120px]'
                        name='dailyHabits'
                        maxLength={500}
                        defaultValue={selectedPet.daily_habits || ''}
                      />
                    </label>

                    <label className='grid gap-2 text-sm font-bold'>
                      Change Photo
                      <div className='rounded-[22px] border border-dashed border-orange-300 bg-gradient-to-b from-orange-50 to-amber-50 px-6 py-6 text-center text-amber-900'>
                        <p className='text-sm font-bold'>
                          Leave empty to keep the current photo. Upload a new one to replace
                          the avatar.
                        </p>
                        <p className='mt-1 text-xs font-normal text-muted'>
                          Supports JPG / PNG / WebP, max 5MB
                        </p>
                        <input
                          className='input-shell mt-4'
                          name='image'
                          type='file'
                          accept='image/png,image/jpeg,image/webp'
                        />
                      </div>
                    </label>
                  </>
                }
                footer={
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
                }
              />

              <PetDangerZoneCard
                description='Deleting this pet will also remove its related chat history, memory summary, and saved memories. If this pet is currently primary, another remaining pet will become the new primary automatically.'
                action={deletePetAction}
                hiddenFields={<input type='hidden' name='petId' value={selectedPet.id} />}
                buttonLabel='Delete This Pet'
              />
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
