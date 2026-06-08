import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { findSubscriptionByUserId } from '@/lib/subscriptions';

/**
 * IMPORTANT:
 * 如果你项目里当前“创建宠物”的 server action 不是这个名字/路径，
 * 只需要把这一行改成你现有的真实导入即可。
 */
import { createPetAction } from '@/app/actions/pets';

const FREE_TIER_MAX_PETS = 2;
const ACTIVE_VIP_STATUSES = new Set(['active', 'trialing', 'past_due']);

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;
type CreatePetPageProps = {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
};

function pickFirst(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

function buildLoginRedirect(message?: string, error?: string) {
  const params = new URLSearchParams();
  if (message) params.set('message', message);
  if (error) params.set('error', error);
  const query = params.toString();
  return query ? `/login?${query}` : '/login';
}

export default async function CreatePetPage({ searchParams }: CreatePetPageProps) {
  if (!hasSupabaseEnv()) {
    redirect(buildLoginRedirect(undefined, 'Please configure Supabase environment variables first.'));
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const message = pickFirst(resolvedSearchParams.message)?.trim() ?? '';
  const error = pickFirst(resolvedSearchParams.error)?.trim() ?? '';

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect('Please log in to create your pet.'));
  }

  const [petOverview, subscription] = await Promise.all([
    getPetsForUser(user.id),
    findSubscriptionByUserId(user.id),
  ]);

  const pets = petOverview?.pets ?? [];
  const petCount = pets.length;

  const vipActive =
    subscription?.plan === 'vip' && ACTIVE_VIP_STATUSES.has(subscription.status ?? '');

  const hitFreePetLimit = !vipActive && petCount >= FREE_TIER_MAX_PETS;

  const limitMessage = hitFreePetLimit
    ? `Free accounts can create up to ${FREE_TIER_MAX_PETS} pets. Upgrade to VIP if you want more companion capacity.`
    : !vipActive
      ? `You are on the Free plan. You can create up to ${FREE_TIER_MAX_PETS} pets total.`
      : 'VIP is active. You can create more companions without the Free plan pet limit.';

  return (
    <div className='app-brand-backdrop'>
      <SiteHeader theme='dark' ctaLabel='Open Memories' ctaHref='/memories' />

      <main className='container-shell py-8 md:py-10'>
        <section className='glass-card p-6 md:p-8'>
          <div className='eyebrow'>✦ Create your companion</div>

          <h1 className='page-title mt-5 text-[clamp(2.4rem,5vw,4.4rem)]'>
            Design a pet that feels like yours
          </h1>

          <p className='page-subtitle mt-4 max-w-4xl text-[1rem] leading-[1.95]'>
            Give your companion a name, personality, favorite things, and everyday habits. The
            details you choose here help shape how the relationship begins.
          </p>

          <div className='mt-5 flex flex-wrap gap-2'>
            <span className={`tag-chip ${vipActive ? 'tag-chip--warm' : 'tag-chip--soft'}`}>
              {vipActive ? 'VIP active' : 'Free plan'}
            </span>
            <span className='tag-chip tag-chip--soft'>
              {petCount} / {vipActive ? 'More available' : `${FREE_TIER_MAX_PETS} pets`}
            </span>
          </div>
        </section>

        {message ? (
          <section className='mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200'>
            {message}
          </section>
        ) : null}

        {error ? (
          <section className='mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200'>
            {error}
          </section>
        ) : null}

        <section className='mt-5 grid gap-5 lg:grid-cols-[1.05fr_.95fr]'>
          <aside className='grid gap-5'>
            <section className='glass-card p-6'>
              <div className='eyebrow'>Plan snapshot</div>
              <h2 className='section-title mt-4 text-2xl'>Your current pet capacity</h2>
              <p className='mt-3 text-sm leading-7 text-body'>{limitMessage}</p>

              <div className='mt-5 grid gap-3'>
                <div className='dark-shell-panel p-4'>
                  <div className='text-sm font-bold text-soft'>Current plan</div>
                  <div className='mt-2 text-base font-semibold text-strong'>
                    {vipActive ? 'VIP Membership' : 'Free Plan'}
                  </div>
                </div>

                <div className='dark-shell-panel p-4'>
                  <div className='text-sm font-bold text-soft'>Pets created</div>
                  <div className='mt-2 text-base font-semibold text-strong'>{petCount}</div>
                </div>

                <div className='dark-shell-panel p-4'>
                  <div className='text-sm font-bold text-soft'>Pet limit</div>
                  <div className='mt-2 text-base font-semibold text-strong'>
                    {vipActive ? 'More than Free plan' : `${FREE_TIER_MAX_PETS} pets on Free`}
                  </div>
                </div>
              </div>
            </section>

            <section className='glass-card p-6'>
              <div className='eyebrow'>What to prepare</div>
              <ul className='mt-5 grid gap-3 text-sm leading-7 text-body'>
                <li className='dark-shell-panel p-4'>
                  A name that feels natural in daily conversation.
                </li>
                <li className='dark-shell-panel p-4'>
                  A personality summary to shape tone and emotional style.
                </li>
                <li className='dark-shell-panel p-4'>
                  Favorite food and habits to make the pet feel more specific and memorable.
                </li>
                <li className='dark-shell-panel p-4'>
                  An optional photo in JPG, PNG, or WebP up to 5 MB.
                </li>
              </ul>
            </section>
          </aside>

          {hitFreePetLimit ? (
            <section className='glass-card p-6 md:p-8'>
              <div className='eyebrow'>Free limit reached</div>
              <h2 className='section-title mt-4 text-[clamp(1.9rem,3vw,2.8rem)]'>
                You’ve reached the Free pet limit
              </h2>

              <p className='mt-4 text-[0.98rem] leading-[1.9] text-body'>
                You already have {petCount} pet{petCount === 1 ? '' : 's'} on the Free plan. Upgrade
                to VIP if you want more companion capacity and deeper long-term continuity.
              </p>

              <div className='mt-6 flex flex-wrap gap-3'>
                <Link href='/pets' className='subtle-button'>
                  Manage Pets
                </Link>
                <Link href='/pricing' className='brand-button'>
                  Upgrade to VIP
                </Link>
                <Link href='/memories' className='subtle-button'>
                  Back to Memories
                </Link>
              </div>
            </section>
          ) : (
            <section className='glass-card p-6 md:p-8'>
              <div className='eyebrow'>Pet profile setup</div>
              <h2 className='section-title mt-4 text-[clamp(1.9rem,3vw,2.8rem)]'>
                Create your first warm companion
              </h2>

              <p className='mt-4 text-[0.98rem] leading-[1.9] text-body'>
                The more specific the profile, the more emotionally consistent your companion can
                feel in early conversations.
              </p>

              <form
                action={createPetAction}
                encType='multipart/form-data'
                className='mt-6 grid gap-5'
              >
                <div className='grid gap-5 md:grid-cols-2'>
                  <label className='grid gap-2'>
                    <span className='text-sm font-bold text-[rgba(255,244,230,0.86)]'>Name</span>
                    <input type='text' name='name' placeholder='Mimi' required />
                  </label>

                  <label className='grid gap-2'>
                    <span className='text-sm font-bold text-[rgba(255,244,230,0.86)]'>Breed</span>
                    <input type='text' name='breed' placeholder='Shiba Inu, British Shorthair, etc.' />
                  </label>
                </div>

                <label className='grid gap-2'>
                  <span className='text-sm font-bold text-[rgba(255,244,230,0.86)]'>
                    Personality
                  </span>
                  <textarea
                    name='personality'
                    placeholder='Warm, affectionate, playful, slightly clingy, loves calm evening chats...'
                    required
                  />
                </label>

                <div className='grid gap-5 md:grid-cols-2'>
                  <label className='grid gap-2'>
                    <span className='text-sm font-bold text-[rgba(255,244,230,0.86)]'>
                      Favorite Food
                    </span>
                    <input
                      type='text'
                      name='favoriteFood'
                      placeholder='Chicken, salmon treats, sweet potato, etc.'
                    />
                  </label>

                  <label className='grid gap-2'>
                    <span className='text-sm font-bold text-[rgba(255,244,230,0.86)]'>
                      Daily Habits
                    </span>
                    <input
                      type='text'
                      name='dailyHabits'
                      placeholder='Morning cuddles, sunset walks, nap after lunch...'
                    />
                  </label>
                </div>

                <label className='grid gap-2'>
                  <span className='text-sm font-bold text-[rgba(255,244,230,0.86)]'>
                    Photo (optional)
                  </span>
                  <input
                    type='file'
                    name='photo'
                    accept='image/jpeg,image/png,image/webp'
                  />
                  <span className='text-xs text-soft'>
                    Accepted: JPG / PNG / WebP · max 5 MB
                  </span>
                </label>

                <div className='flex flex-wrap gap-3 pt-2'>
                  <button type='submit' className='brand-button'>
                    Create Pet
                  </button>
                  <Link href='/memories' className='subtle-button'>
                    Cancel
                  </Link>
                </div>
              </form>
            </section>
          )}
        </section>
      </main>

      <SiteFooter text='© 2026 EchoPaws.ai. All Rights Reserved.' />
    </div>
  );
}
