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

function fieldClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-stone-500 outline-none transition focus:border-amber-300/35 focus:bg-white/[0.05] focus:ring-4 focus:ring-amber-400/10';
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
    <div className='min-h-screen overflow-hidden bg-[#060504] text-[#f7efe5]'>
      <div className='pointer-events-none fixed inset-0'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,158,11,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_22%),linear-gradient(180deg,#0b0908_0%,#060504_48%,#050404_100%)]' />
        <div className='absolute left-[-10%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-3xl' />
        <div className='absolute right-[-8%] top-[12%] h-[22rem] w-[22rem] rounded-full bg-amber-300/8 blur-3xl' />
      </div>

      <div className='relative z-10 hidden md:block'>
        <SiteHeader theme='dark' ctaLabel='Open Memories' ctaHref='/memories' />
      </div>

      <main className='container-shell relative z-10 py-10 md:py-14'>
        <div className='mx-auto max-w-4xl'>
          <section className='rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,17,13,0.92),rgba(11,9,8,0.92))] p-7 shadow-[0_24px_56px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-9'>
            <div className='inline-flex items-center gap-2 rounded-full border border-amber-300/16 bg-amber-300/10 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-amber-200'>
              ✦ Create Pet
            </div>

            <h1 className='mt-4 text-[clamp(2.3rem,4vw,4.4rem)] font-black tracking-[-0.05em] text-white'>
              Create your AI pet profile
            </h1>

            <p className='mt-4 max-w-3xl text-[1rem] leading-[1.9] text-stone-300'>
              Fill in a few details so EchoPaws can start building memory,
              personality, and a warmer companionship style around your pet.
            </p>

            <div className='mt-5 flex flex-wrap gap-2'>
              <span className='rounded-full border border-amber-300/16 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200'>
                Noir Mode
              </span>
              <span className='rounded-full border border-amber-300/16 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200'>
                Supabase Save
              </span>
              <span className='rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-300'>
                Auto Open Chat
              </span>
            </div>

            {message ? (
              <div className='mt-5 rounded-2xl border border-emerald-400/18 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200'>
                {message}
              </div>
            ) : null}

            {limitMessage ? (
              <div className='mt-5 rounded-2xl border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100'>
                {limitMessage}
              </div>
            ) : null}

            {hitFreePetLimit ? (
              <>
                <div className='mt-6 rounded-[26px] border border-white/10 bg-white/[0.05] px-5 py-5 text-sm leading-7 text-stone-200 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl'>
                  <div className='text-xs font-bold uppercase tracking-[0.16em] text-amber-200'>
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
                  <label className='grid gap-2 text-sm font-bold text-stone-100'>
                    Name
                    <input
                      className={fieldClassName()}
                      name='name'
                      type='text'
                      placeholder='e.g. Max'
                      required
                      maxLength={30}
                    />
                  </label>

                  <label className='grid gap-2 text-sm font-bold text-stone-100'>
                    Breed
                    <input
                      className={fieldClassName()}
                      name='breed'
                      type='text'
                      placeholder='e.g. Shiba Inu'
                      required
                      maxLength={30}
                    />
                  </label>
                </div>

                <label className='grid gap-2 text-sm font-bold text-stone-100'>
                  Personality
                  <input
                    className={fieldClassName()}
                    name='personality'
                    type='text'
                    placeholder='e.g. Playful, clingy, loves belly rubs'
                    required
                    maxLength={120}
                  />
                </label>

                <label className='grid gap-2 text-sm font-bold text-stone-100'>
                  Favorite Food
                  <input
                    className={fieldClassName()}
                    name='favoriteFood'
                    type='text'
                    placeholder='e.g. Chicken breast, freeze-dried treats'
                    maxLength={120}
                  />
                </label>

                <label className='grid gap-2 text-sm font-bold text-stone-100'>
                  Daily Habits
                  <textarea
                    className={`${fieldClassName()} min-h-[120px] resize-y`}
                    name='dailyHabits'
                    placeholder='e.g. Loves waiting by the door, sleeps on the couch at night'
                    maxLength={500}
                  />
                </label>

                <label className='grid gap-2 text-sm font-bold text-stone-100'>
                  Upload Photo
                  <div className='rounded-[24px] border border-dashed border-amber-300/24 bg-amber-300/8 px-6 py-6 text-center'>
                    <div className='text-3xl'>📸</div>
                    <p className='mt-3 text-sm font-bold text-amber-100'>
                      Supports JPG / PNG / WebP, max 5MB
                    </p>
                    <p className='mt-1 text-xs font-normal leading-6 text-stone-400'>
                      The image will be stored with your pet profile and used to
                      personalize the experience.
                    </p>

                    <input
                      className='mt-4 block w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-200 file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-amber-300 file:to-orange-500 file:px-4 file:py-2 file:text-sm file:font-bold file:text-stone-950'
                      name='image'
                      type='file'
                      accept='image/png,image/jpeg,image/webp'
                      required
                    />
                  </div>
                </label>

                <div className='grid gap-3 pt-2 md:grid-cols-2'>
                  <button type='submit' className='brand-button w-full'>
                    Create Pet and Open Chat
                  </button>

                  <Link href='/memories' className='subtle-button w-full text-center'>
                    Back to Memories
                  </Link>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>

      <div className='relative z-10'>
        <SiteFooter text='© 2026 EchoPaws.ai. All Rights Reserved.' />
      </div>
    </div>
  );
}
