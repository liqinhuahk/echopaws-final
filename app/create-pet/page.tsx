import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createPetAction } from '@/app/actions/pets';
import { findSubscriptionByUserId } from '@/lib/subscriptions';
import { getPetsForUser } from '@/lib/pets';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  createServerSupabaseClient,
  hasSupabaseEnv,
} from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type SearchParamsValue = string | string[] | undefined;

type CreatePetPageProps = {
  searchParams?:
    | Promise<{
        message?: SearchParamsValue;
        error?: SearchParamsValue;
      }>
    | {
        message?: SearchParamsValue;
        error?: SearchParamsValue;
      };
};

const FREE_TIER_MAX_PETS = 2;
const ACTIVE_VIP_STATUSES = new Set(['active', 'trialing', 'past_due']);

function pickFirst(value: SearchParamsValue) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function buildLoginRedirect(params: { message?: string; error?: string }) {
  const search = new URLSearchParams();

  if (params.message) {
    search.set('message', params.message);
  }

  if (params.error) {
    search.set('error', params.error);
  }

  const query = search.toString();
  return query ? `/login?${query}` : '/login';
}

export default async function CreatePetPage({
  searchParams,
}: CreatePetPageProps) {
  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : {};

  const message = pickFirst(resolvedSearchParams.message).trim();
  const error = pickFirst(resolvedSearchParams.error).trim();

  if (!hasSupabaseEnv()) {
    redirect(
      buildLoginRedirect({
        error: 'Please configure Supabase first.',
      }),
    );
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    redirect(
      buildLoginRedirect({
        error: 'Unable to verify your session. Please sign in again.',
      }),
    );
  }

  if (!user) {
    redirect(
      buildLoginRedirect({
        message: 'Please log in to continue.',
      }),
    );
  }

  const [petOverview, subscription] = await Promise.all([
    getPetsForUser(user.id).catch(() => ({ pets: [], defaultPetId: null })),
    findSubscriptionByUserId(user.id).catch(() => null),
  ]);

  const pets = petOverview?.pets ?? [];
  const petCount = pets.length;

  const vipActive =
    subscription?.plan === 'vip' &&
    ACTIVE_VIP_STATUSES.has(subscription.status ?? '');

  const hitFreePetLimit = !vipActive && petCount >= FREE_TIER_MAX_PETS;

  const limitMessage =
    error ||
    (hitFreePetLimit
      ? `Free plan supports up to ${FREE_TIER_MAX_PETS} pets. Upgrade to VIP to create more pets.`
      : '');

  return (
    <div className='app-brand-backdrop'>
      <div className='hidden md:block'>
        <SiteHeader ctaLabel='Open Memories' ctaHref='/memories' />
      </div>

      <main className='container-shell py-10 md:py-14'>
        <div className='mx-auto max-w-4xl'>
          <section className='rounded-[32px] border border-white/55 bg-white/78 p-7 shadow-[0_20px_48px_rgba(15,23,42,0.09)] backdrop-blur-md md:p-9'>
            <div className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/90 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-orange-700'>
              🐾 Create Pet
            </div>

            <h1 className='mt-4 text-[clamp(2.3rem,4vw,4.4rem)] font-black tracking-[-0.05em] text-slate-900'>
              Create your AI pet profile
            </h1>

            <p className='mt-4 max-w-3xl text-[1rem] leading-[1.9] text-slate-600'>
              Fill in a few details so EchoPaws can start building memory,
              personality, and a warmer companionship style around your pet.
            </p>

            {message ? (
              <div className='mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
                {message}
              </div>
            ) : null}

            {limitMessage ? (
              <div className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
                {limitMessage}
              </div>
            ) : null}

            {hitFreePetLimit ? (
              <>
                <div className='mt-6 rounded-[26px] border border-white/55 bg-white/74 px-5 py-5 text-sm leading-7 text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.06)] backdrop-blur-md'>
                  <div className='text-xs font-bold uppercase tracking-[0.16em] text-orange-700'>
                    Pet Limit Reached
                  </div>
                  <p className='mt-2'>
                    Your account currently has <strong>{petCount}</strong> pets on
                    the Free plan. To create more pets, upgrade to VIP or manage
                    your existing pets first.
                  </p>
                </div>

                <div className='mt-6 flex flex-wrap gap-3'>
                  <Link href='/pets' className='brand-button'>
                    Manage Pets
                  </Link>

                  <Link href='/pricing' className='subtle-button'>
                    Upgrade to VIP
                  </Link>

                  <Link href='/memories' className='subtle-button'>
                    Back to Memories
                  </Link>
                </div>
              </>
            ) : (
              <form
                action={createPetAction}
                className='mt-7 grid gap-5'
                encType='multipart/form-data'
              >
                <div className='grid gap-5 md:grid-cols-2'>
                  <label className='grid gap-2 text-sm font-bold text-slate-800'>
                    Name
                    <input
                      className='input-shell'
                      name='name'
                      type='text'
                      placeholder='e.g. Max'
                      required
                      maxLength={30}
                    />
                  </label>

                  <label className='grid gap-2 text-sm font-bold text-slate-800'>
                    Breed
                    <input
                      className='input-shell'
                      name='breed'
                      type='text'
                      placeholder='e.g. Shiba Inu'
                      required
                      maxLength={30}
                    />
                  </label>
                </div>

                <label className='grid gap-2 text-sm font-bold text-slate-800'>
                  Personality
                  <input
                    className='input-shell'
                    name='personality'
                    type='text'
                    placeholder='e.g. Playful, clingy, loves belly rubs'
                    required
                    maxLength={120}
                  />
                </label>

                <label className='grid gap-2 text-sm font-bold text-slate-800'>
                  Favorite Food
                  <input
                    className='input-shell'
                    name='favoriteFood'
                    type='text'
                    placeholder='e.g. Chicken breast, freeze-dried treats'
                    maxLength={120}
                  />
                </label>

                <label className='grid gap-2 text-sm font-bold text-slate-800'>
                  Daily Habits
                  <textarea
                    className='input-shell min-h-[120px]'
                    name='dailyHabits'
                    placeholder='e.g. Loves waiting by the door, sleeps on the couch at night'
                    maxLength={500}
                  />
                </label>

                <label className='grid gap-2 text-sm font-bold text-slate-800'>
                  Upload Photo
                  <div className='rounded-[24px] border border-dashed border-orange-300 bg-gradient-to-b from-orange-50 to-amber-50 px-6 py-6 text-center text-amber-900'>
                    <div className='text-3xl'>📸</div>
                    <p className='mt-3 text-sm font-bold'>
                      Supports JPG / PNG / WebP, max 5MB
                    </p>
                    <p className='mt-1 text-xs font-normal leading-6 text-slate-600'>
                      The image will be stored with your pet profile and used to
                      personalize the experience.
                    </p>
                    <input
                      className='input-shell mt-4'
                      name='image'
                      type='file'
                      accept='image/png,image/jpeg,image/webp'
                      required
                    />
                  </div>
                </label>

                <div className='flex flex-wrap gap-3 pt-2'>
                  <button type='submit' className='brand-button'>
                    Save Pet Profile
                  </button>

                  <Link href='/memories' className='subtle-button'>
                    Back to Memories
                  </Link>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>

      <SiteFooter text='© 2026 EchoPaws.ai. Create your first pet profile.' />
    </div>
  );
}
