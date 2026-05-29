import Link from 'next/link';
import {
  PetEmptyStateCard,
  PetNoticeBanner,
  PetPageHeroCard,
  PetSidebarProfileCard,
  PetToolbarCard,
} from '@/components/pet-cards';
import { ChatPlayground } from '@/components/chat-playground';
import { PetSwitcher } from '@/components/pet-switcher';
import { getPetOrderDescription } from '@/components/pet-ui-badges';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  FREE_TOTAL_CHAT_LIMIT,
  getChatAccessState,
} from '@/lib/chat-access';
import { getPrimaryPetAndContext } from '@/lib/chat-service';
import { FREE_TIER_MAX_PETS, getPetsForUser } from '@/lib/pets';
import {
  createServerSupabaseClient,
  hasSupabaseEnv,
} from '@/lib/supabase/server';

const fallbackMessages = [
  { role: 'user' as const, content: 'Hey Max! What did you do today?' },
  {
    role: 'assistant' as const,
    content:
      "*purrrrrrr* I waited for you by the window again today. You seemed tired yesterday — I hope you can rest a bit sooner today.",
  },
  { role: 'user' as const, content: 'I am feeling a little down today.' },
  {
    role: 'assistant' as const,
    content:
      "*nuzzles your hand* Then let me stay close to you for a while. You always handle things on your own, and I remember that — so today I want to hold you a little tighter.",
  },
];

type PetCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  isPrimary?: boolean;
};

function truncateText(text: string, max = 150) {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: { pet_created?: string; pet_name?: string; pet_id?: string };
}) {
  const selectedPetId = searchParams?.pet_id || null;

  let petId: string | null = selectedPetId;
  let petName = 'Dog';
  let petBreed = 'Ragdoll';
  let petPersonality = 'Playful';
  let favoriteFood = 'dried food';
  let dailyHabit = 'Sleep and Chat';
  let petImageUrl: string | null = null;
  let memorySummary =
    "You're feeling tired, and I'm here to offer comfort and companionship. I love when you scratch my ears, and I'm always happy to talk about my naps with you.";
  let emotionSummary =
    'The pet expresses affection and a desire for companionship.';
  let usageLabel = `${FREE_TOTAL_CHAT_LIMIT} lifetime chats on Free`;
  let usageDetail = `Free includes ${FREE_TOTAL_CHAT_LIMIT} lifetime chats shared across your account. Chats do not reset daily.`;
  let vipHint = `Upgrade to VIP for unlimited chats, more than ${FREE_TIER_MAX_PETS} pets, deeper memory, and richer emotional continuity.`;
  let initialMessages = fallbackMessages;
  let hasPet = false;
  let pets: PetCard[] = [];
  let selectedPetIsPrimary = false;
  let selectedPetOrderLabel = getPetOrderDescription(false);
  let freePlanWarning: string | null = null;
  let headerCtaLabel = 'Upgrade to VIP';
  let headerCtaHref = '/pricing';

  if (hasSupabaseEnv()) {
    try {
      const supabase = createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [petsData, accessState, context] = await Promise.all([
          getPetsForUser(user.id),
          getChatAccessState(user.id),
          getPrimaryPetAndContext(user.id, selectedPetId),
        ]);

        pets = petsData.pets.map((pet) => ({
          id: pet.id,
          name: pet.name,
          imageUrl: pet.image_url || null,
          isPrimary: pet.id === petsData.defaultPetId,
        }));

        if (context.pet) {
          hasPet = true;
          petId = context.pet.id;
          petName = context.pet.name || petName;
          petBreed = context.pet.breed || petBreed;
          petPersonality = context.pet.personality || petPersonality;
          favoriteFood = context.pet.favorite_food || favoriteFood;
          dailyHabit = context.pet.daily_habits || dailyHabit;
          petImageUrl = context.pet.image_url || null;

          const selectedPetMeta = pets.find((pet) => pet.id === context.pet?.id);
          selectedPetIsPrimary = Boolean(selectedPetMeta?.isPrimary);
          selectedPetOrderLabel = getPetOrderDescription(selectedPetIsPrimary);
        }

        if (context.memorySummary?.summary) {
          memorySummary = context.memorySummary.summary;
        } else if (context.memories.length > 0) {
          memorySummary = context.memories
            .map((item) => item.content)
            .slice(0, 2)
            .join('. ');
        }

        const emotionMemory = context.memories.find(
          (item) => item.type === 'emotion',
        );
        if (emotionMemory?.content) {
          emotionSummary = emotionMemory.content;
        }

        if (context.history.length > 0) {
          initialMessages = context.history
            .filter((item) => item.role === 'user' || item.role === 'assistant')
            .map((item) => ({
              role: item.role === 'assistant' ? 'assistant' : 'user',
              content: item.content,
            }));
        }

        if (accessState.vip) {
          usageLabel = 'VIP — Unlimited Chat';
          usageDetail =
            'VIP active: unlimited chats across your account and across all pets.';
          vipHint =
            'You are on VIP. Your account has unlimited chats, more pet capacity, deeper memory, and richer emotional continuity.';
          headerCtaLabel = 'Manage Membership';
          headerCtaHref = '/account';
        } else {
          const remaining = accessState.remaining ?? 0;
          const limit = accessState.limit ?? FREE_TOTAL_CHAT_LIMIT;

          usageLabel = `${remaining} / ${limit} lifetime chats left`;
          usageDetail = `Used ${accessState.used} of ${limit} lifetime chats. Free chats are shared across your account and do not reset daily.`;

          if (remaining <= 0) {
            freePlanWarning = `You have used all ${limit} lifetime Free chats. Upgrade to VIP to keep talking with your pets.`;
          } else if (remaining <= 5) {
            freePlanWarning = `You only have ${remaining} lifetime Free chat${
              remaining === 1 ? '' : 's'
            } left. Upgrade to VIP for unlimited chats.`;
          }
        }
      }
    } catch {
      // Fallback to preview content when env or data are incomplete.
    }
  }

  const memoriesHref = petId
    ? `/memories?pet_id=${encodeURIComponent(petId)}`
    : '/memories';

  return (
    <>
      <SiteHeader ctaLabel={headerCtaLabel} ctaHref={headerCtaHref} />

      <main className='container-shell py-10'>
        <PetPageHeroCard
          eyebrow='AI Pet Chat'
          title='Chat stays primary. Context stays close.'
          description={`Switch between pets on the same account. Free includes ${FREE_TOTAL_CHAT_LIMIT} lifetime chats shared across your account and up to ${FREE_TIER_MAX_PETS} pets. This layout keeps pet context on the left and keeps the chat area cleaner on the right.`}
          notice={
            <>
              {searchParams?.pet_created === '1' ? (
                <PetNoticeBanner tone='success'>
                  {searchParams.pet_name
                    ? `Pet ${searchParams.pet_name} created. You can start chatting now.`
                    : 'Pet created. You can start chatting now.'}
                </PetNoticeBanner>
              ) : null}

              {freePlanWarning ? (
                <div className={searchParams?.pet_created === '1' ? 'mt-3' : ''}>
                  <PetNoticeBanner tone='warning'>{freePlanWarning}</PetNoticeBanner>
                </div>
              ) : null}
            </>
          }
        />

        {pets.length > 0 ? (
          <PetToolbarCard className='mt-8'>
            <PetSwitcher
              pets={pets}
              selectedPetId={petId}
              basePath='/chat'
              title='Switch Chat Pet'
              description={`You have ${pets.length} pet${
                pets.length !== 1 ? 's' : ''
              }. The primary pet stays at the top; others are ordered by recent activity. On smaller screens, the layout stacks so chat remains the main focus.`}
            />
          </PetToolbarCard>
        ) : null}

        {!hasPet ? (
          <PetEmptyStateCard
            className='mt-8'
            title='No pet profile yet'
            description={`Create your first pet to unlock a real profile, memory context, and long-term companionship. Free supports up to ${FREE_TIER_MAX_PETS} pets and ${FREE_TOTAL_CHAT_LIMIT} lifetime chats.`}
            primaryAction={{ label: 'Create Your First Pet', href: '/create-pet' }}
          />
        ) : (
          <section className='mt-8 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]'>
            <aside className='space-y-5'>
              <PetSidebarProfileCard
                name={petName}
                imageUrl={petImageUrl}
                subtitle={`${petBreed} · ${petPersonality}`}
                primary={selectedPetIsPrimary}
                placeholderEmoji='🐶'
                orderHintText={`Ordering: ${selectedPetOrderLabel}`}
                imageWrapperClassName='bg-gradient-to-br from-amber-200 to-orange-200'
                nameClassName='text-xl'
                subtitleClassName='text-xs'
                chips={
                  <>
                    <span className='tag-chip'>Loves: {favoriteFood}</span>
                    <span className='tag-chip'>Habit: {dailyHabit}</span>
                  </>
                }
                sections={[
                  {
                    title: 'Pet Info',
                    content: (
                      <>
                        Name: {petName}
                        <br />
                        Breed: {petBreed}
                        <br />
                        Personality: {petPersonality}
                        <br />
                        Order: {selectedPetOrderLabel}
                      </>
                    ),
                    contentClassName: 'mt-2 text-sm leading-7 text-muted',
                  },
                  {
                    title: 'Companionship Summary',
                    action: (
                      <Link
                        href={memoriesHref}
                        className='text-xs font-bold text-orange-700 hover:text-orange-900'
                      >
                        Manage Memory →
                      </Link>
                    ),
                    content: truncateText(memorySummary, 170),
                    contentClassName:
                      'mt-2 whitespace-pre-line text-sm leading-7 text-muted',
                  },
                  {
                    title: 'Emotional State',
                    content: truncateText(emotionSummary, 120),
                    contentClassName: 'mt-2 text-sm leading-7 text-muted',
                  },
                ]}
                footer={
                  <PetNoticeBanner tone='warning'>{vipHint}</PetNoticeBanner>
                }
              />
            </aside>

            <section className='min-w-0'>
              <div className='glass-card p-6'>
                <div className='flex flex-wrap items-start justify-between gap-4'>
                  <div>
                    <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
                      Chat Workspace
                    </div>
                    <h2 className='mt-2 text-2xl font-extrabold'>
                      Chat with {petName}
                    </h2>
                    <p className='mt-2 text-sm leading-7 text-muted'>
                      You are viewing {petName}&apos;s dedicated chat context.
                      Switching to another pet will also switch the conversation
                      history and memory context. Summary stays collapsed by
                      default so the chat area remains easier to read.
                    </p>
                  </div>

                  <div className='rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-orange-800'>
                    {usageLabel}
                  </div>
                </div>

                <div className='mt-5 flex flex-wrap items-center gap-3'>
                  <a href={memoriesHref} className='subtle-button'>
                    Open Pet Memory Page
                  </a>

                  <details className='group'>
                    <summary className='cursor-pointer list-none rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-ink transition hover:bg-stone-50'>
                      <span className='group-open:hidden'>View Companionship Summary</span>
                      <span className='hidden group-open:inline'>
                        Hide Companionship Summary
                      </span>
                    </summary>

                    <div className='mt-3 rounded-[24px] border border-black/5 bg-card-gradient p-4'>
                      <div className='flex flex-wrap items-start justify-between gap-3'>
                        <div>
                          <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
                            Companionship Summary
                          </div>
                          <div className='mt-2 text-sm leading-8 text-ink'>
                            {memorySummary}
                          </div>
                        </div>

                        <Link
                          href={memoriesHref}
                          className='text-xs font-bold text-orange-700 hover:text-orange-900'
                        >
                          Open full memory view →
                        </Link>
                      </div>

                      <div className='mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm leading-7 text-muted'>
                        <span className='font-bold text-ink'>Emotional State: </span>
                        {emotionSummary}
                      </div>
                    </div>
                  </details>
                </div>

                <div className='mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700'>
                  {usageDetail}
                </div>

                <div className='mt-6'>
                  <ChatPlayground
                    petId={petId}
                    initialMessages={initialMessages}
                    initialRemainingLabel={usageLabel}
                    initialMemorySummary=''
                  />
                </div>
              </div>
            </section>
          </section>
        )}
      </main>

      <SiteFooter rightText='Collapsed Summary · Cleaner Chat Layout · Multi-Pet Switching · Unified with Memory Center' />
    </>
  );
}
