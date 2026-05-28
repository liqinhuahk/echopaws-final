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
  PetOverviewCard,
  PetPageHeroCard,
  PetSidebarProfileCard,
  PetStatsGrid,
  PetToolbarCard,
} from '@/components/pet-cards';
import { PetSwitcher } from '@/components/pet-switcher';
import { PetOrderHint } from '@/components/pet-ui-badges';
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

  return (
    <>
      <SiteHeader
        ctaLabel={freePlanCapReached ? 'Upgrade to VIP' : 'Create New Pet'}
        ctaHref={freePlanCapReached ? '/pricing' : '/create-pet'}
      />

      <FloatingToast message={searchParams?.message || null} tone='success' />
      <FloatingToast message={searchParams?.error || null} tone='error' />

      <main className='container-shell py-10'>
        <PetPageHeroCard
          eyebrow='Pet Manager'
          title='Manage Your EchoPaws Companions'
          description='This page is your multi-pet management center. Switch pets quickly, view chat activity, memory counts, and companionship summaries per pet. Edit, set as primary, or delete directly from here.'
        />

        {isVip ? (
          <div className='mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900'>
            <div className='font-extrabold uppercase tracking-[0.06em] text-emerald-800'>
              VIP Active
            </div>
            <div className='mt-2'>
              Your account is currently on <strong>VIP</strong>. You are not limited
              by the Free-tier 2-pet cap and can continue creating more companions.
            </div>
          </div>
        ) : freePlanCapReached ? (
          <div className='mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900'>
            <div className='font-extrabold uppercase tracking-[0.06em] text-orange-800'>
              Free Tier Pet Limit Reached
            </div>
            <div className='mt-2'>
              Your Free account already has <strong>{data.pets.length} AI pets</strong>.
              Free tier can keep up to <strong>{FREE_TIER_MAX_PETS} pets</strong>.
            </div>
            <div className='mt-2'>
              To add another pet, you can either delete one existing pet first, or
              upgrade to <strong>VIP</strong> to unlock more pet slots, unlimited
              conversations, and deeper long-term memory.
            </div>
            <div className='mt-4 flex flex-wrap gap-3'>
              <Link href='/pricing' className='brand-button'>
                Upgrade to VIP
              </Link>
              <Link href='/create-pet' className='subtle-button'>
                Try Create Page Anyway
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
                  {remainingPetSlots !== 1 ? 's' : ''} before reaching the Free-tier
                  limit of <strong>{FREE_TIER_MAX_PETS}</strong>.
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
        )}

        <PetStatsGrid
          className='mt-8'
          items={[
            {
              label: 'Total Pets',
              value: data.pets.length,
              description: `You have created ${data.pets.length} switchable companion${
                data.pets.length !== 1 ? 's' : ''
              }.`,
            },
            {
              label: 'Total Memories',
              value: data.totalMemories,
              description:
                'Memories accumulated across all pets. Continuously influences response warmth.',
            },
            {
              label: 'Total Conversations',
              value: data.totalConversations,
              description:
                'Used to tell which pet is most frequently accompanied, and to observe interaction depth.',
            },
            {
              label: isVip ? 'Plan Status' : 'Free Slots Left',
              value: isVip ? 'VIP Active' : remainingPetSlots,
              valueClassName: 'mt-2 text-2xl font-extrabold tracking-tight',
              description: isVip
                ? 'VIP removes the Free-tier 2-pet limit.'
                : `Free tier allows up to ${FREE_TIER_MAX_PETS} pets. Upgrade if you want more.`,
            },
            {
              label: 'Most Active',
              value: latestActivePet?.name || 'Not chatted yet',
              valueClassName: 'mt-2 text-2xl font-extrabold tracking-tight',
              description: latestActivePet?.last_chat_at
                ? `Last interaction: ${formatDate(latestActivePet.last_chat_at)}`
                : 'Start chatting and this will show the most recently active pet.',
            },
          ]}
        />

        {data.pets.length ? (
          <PetToolbarCard className='mt-8'>
            <PetSwitcher
              pets={data.pets.map((pet) => ({
                id: pet.id,
                name: pet.name,
                imageUrl: pet.image_url,
                isPrimary: pet.id === data.defaultPetId,
              }))}
              selectedPetId={selectedPetId}
              basePath='/pets'
              title='Switch Pet to Edit'
              description={`You have ${data.pets.length} pet${
                data.pets.length !== 1 ? 's' : ''
              }. The primary pet stays at the top; others are sorted by recent interaction, memory, and update time. After switching, the right panel loads that pet's full settings.`}
            />
          </PetToolbarCard>
        ) : null}

        {!selectedPet ? (
          <PetEmptyStateCard
            className='mt-8'
            title='No pets created yet'
            description='Create your first pet and this becomes your multi-pet management hub — view summaries, memory, and chat activity for each companion. Free tier supports up to 2 pets.'
            primaryAction={{ label: 'Create Your First Pet', href: '/create-pet' }}
          />
        ) : (
          <>
            <section className='mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {data.pets.map((pet, index) => {
                const active = pet.id === selectedPet.id;
                const isDefault = pet.id === data.defaultPetId;

                return (
                  <PetOverviewCard
                    key={pet.id}
                    href={`/pets?pet_id=${encodeURIComponent(pet.id)}`}
                    name={pet.name}
                    imageUrl={pet.image_url}
                    breed={pet.breed}
                    personality={pet.personality}
                    summary={pet.summary}
                    memoryCount={pet.memory_count}
                    conversationCount={pet.conversation_count}
                    lastChatText={formatDate(pet.last_chat_at)}
                    primary={isDefault}
                    selected={active}
                    order={index + 1}
                  />
                );
              })}
            </section>

            {!isVip && freePlanCapReached ? (
              <div className='mt-6 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm leading-7 text-orange-900'>
                <div className='font-extrabold'>Want to add more companions?</div>
                <div className='mt-1'>
                  You have already reached the Free-tier maximum of{' '}
                  <strong>{FREE_TIER_MAX_PETS} pets</strong>. Upgrade to VIP to add
                  more pets without this limit.
                </div>
                <div className='mt-4'>
                  <Link href='/pricing' className='brand-button inline-flex'>
                    See VIP Benefits
                  </Link>
                </div>
              </div>
            ) : null}

            <section className='mt-8 grid gap-5 lg:grid-cols-[360px_1fr]'>
              <aside className='glass-card p-6'>
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
                      ? 'Primary pet — fixed at top'
                      : 'Sorted by recent activity'
                  }`}
                  sections={[
                    {
                      title: 'Lifestyle Info',
                      content: (
                        <>
                          <strong>Loves:</strong>{' '}
                          {selectedPet.favorite_food || 'Not set yet'}
                          <br />
                          <strong>Habit:</strong>{' '}
                          {selectedPet.daily_habits || 'Not set yet'}
                        </>
                      ),
                    },
                    {
                      title: 'Companionship Summary',
                      content: <div className='whitespace-pre-line'>{selectedPet.summary}</div>,
                      contentClassName:
                        'mt-2 whitespace-pre-line text-sm leading-7 text-slate-700',
                    },
                    {
                      title: 'Plan Capacity',
                      content: isVip ? (
                        <>VIP active — this account is not limited by the Free-tier 2-pet cap.</>
                      ) : (
                        <>
                          Free tier supports up to {FREE_TIER_MAX_PETS} pets. You
                          currently have {data.pets.length}.{' '}
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
                      label: 'Sort Position',
                      value: (
                        <PetOrderHint
                          isPrimary={selectedPet.id === data.defaultPetId}
                          className='text-sm font-semibold text-slate-700'
                        />
                      ),
                      valueClassName: 'mt-2 text-sm font-semibold text-slate-700',
                    },
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
                  footer={
                    <PetActionPanel
                      items={[
                        {
                          key: 'chat',
                          label: 'Start chat with this pet',
                          href: `/chat?pet_id=${encodeURIComponent(selectedPet.id)}`,
                          variant: 'primary',
                        },
                        {
                          key: 'memory',
                          label: 'View this pet memory',
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
                                  This is your primary pet — it stays fixed at the top.
                                </PetNoticeBanner>
                              ),
                            },
                        {
                          key: 'tips',
                          node: (
                            <div className='rounded-[24px] border border-black/5 bg-white p-5'>
                              <h3 className='text-base font-extrabold'>Management Tips</h3>
                              <ul className='mt-3 grid gap-2 text-sm leading-7 text-muted'>
                                <li>
                                  • The primary pet becomes the default chat target when no
                                  pet_id is specified, and stays fixed at the top of the
                                  manager.
                                </li>
                                <li>
                                  • Updating personality, habits, and preferences syncs to the
                                  prompt for all future conversations.
                                </li>
                                <li>
                                  • Deleting a pet also removes its chat history and memories.
                                </li>
                                {!isVip ? (
                                  <li>
                                    • Free tier supports up to {FREE_TIER_MAX_PETS} pets. Upgrade
                                    to VIP if you want more companions.
                                  </li>
                                ) : null}
                              </ul>
                            </div>
                          ),
                        },
                      ]}
                    />
                  }
                />
              </aside>

              <div className='grid gap-6'>
                <PetEditFormCard
                  title='Edit Pet Profile'
                  description='Change name, breed, personality, preferences, and habits. You can also upload a new avatar. If you skip the image, the current photo stays. These changes sync directly to the chat character settings.'
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
                          <div className='text-3xl'>🖼️</div>
                          <p className='mt-3 text-sm font-bold'>
                            Leave empty to keep current photo. Upload a new one to replace
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
                  description='After deletion, this pet chat history, summary, and related memories will all be removed. If this was the primary pet, the system will automatically use another remaining pet as the new primary. If there is no remaining pet, the default will be cleared.'
                  action={deletePetAction}
                  hiddenFields={<input type='hidden' name='petId' value={selectedPet.id} />}
                  buttonLabel='Delete This Pet'
                />
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter rightText='Pet Overview / Primary Pet Sort / Save Toast / Quick Switching / Free 2-Pet Limit' />
    </>
  );
}
