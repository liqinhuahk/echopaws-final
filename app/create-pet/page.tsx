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
  return [
    'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5',
    'text-sm text-white placeholder:text-stone-500',
    'outline-none transition',
    'focus:border-amber-300/40 focus:bg-white/7 focus:ring-4 focus:ring-amber-400/10',
  ].join(' ');
}

function primaryButtonClassName() {
  return [
    'inline-flex min-h-12 items-center justify-center rounded-full px-5',
    'bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500',
    'text-sm font-extrabold text-stone-950 shadow-lg shadow-orange-900/20',
    'transition hover:brightness-105 active:scale-[0.99]',
  ].join(' ');
}

function secondaryButtonClassName() {
  return [
    'inline-flex min-h-12 items-center justify-center rounded-full px-5',
    'border border-white/12 bg-white/6 text-sm font-bold text-white',
    'transition hover:bg-white/10',
  ].join(' ');
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
    <div className='min-h-screen bg-black text-white'>
      <div className='relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-stone-950 via-[#110d0b] to-black'>
        <div className='pointer-events-none absolute inset-0 opacity-40'>
          <div className='absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-orange-500/12 blur-3xl' />
          <div className='absolute right-[-6%] top-[10%] h-80 w-80 rounded-full bg-amber-300/10 blur-3xl' />
          <div className='absolute bottom-[-12%] left-[20%] h-96 w-96 rounded-full bg-rose-400/8 blur-3xl' />
        </div>

        <div className='relative z-10 hidden md:block'>
          <SiteHeader
            ctaLabel='Open Memories'
            ctaHref='/memories'
            theme='dark'
          />
        </div>

        <main className='container-shell relative z-10 py-10 md:py-14'>
          <div className='mx-auto max-w-5xl'>
            <section className='overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-xl'>
              <div className='border-b border-white/8 bg-gradient-to-r from-white/6 via-white/3 to-transparent px-6 py-6 md:px-8 md:py-7'>
                <div className='inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.24em] text-amber-200'>
                  ✦ Create Pet
                </div>

                <h1 className='mt-4 text-4xl font-black tracking-tight text-white md:text-6xl'>
                  Create your AI pet profile
                </h1>

                <p className='mt-4 max-w-3xl text-sm leading-7 text-stone-300 md:text-base'>
                  Build a real pet profile, save it to your account, and open the
                  new chat automatically after creation.
                </p>

                <div className='mt-5 flex flex-wrap gap-2'>
                  <span className='inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-200'>
                    Noir Mode
                  </span>
                  <span className='inline-flex items-center rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200'>
                    Supabase Save
                  </span>
                  <span className='inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-200'>
                    Auto Open Chat
                  </span>
                </div>
              </div>

              <div className='px-6 py-6 md:px-8 md:py-8'>
                {message ? (
                  <div className='mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200'>
                    {message}
                  </div>
                ) : null}

                {limitMessage ? (
                  <div className='mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-200'>
                    {limitMessage}
                  </div>
                ) : null}

                {hitFreePetLimit ? (
                  <div className='grid gap-5'>
                    <div className='rounded-[26px] border border-white/10 bg-white/4 p-5 text-sm leading-7 text-stone-300'>
                      <div className='text-xs font-bold uppercase tracking-[0.18em] text-amber-200'>
                        Pet Limit Reached
                      </div>

                      <p className='mt-3'>
                        Your account currently has <strong>{petCount}</strong> pets
                        on the Free plan. To create more pets, upgrade to VIP or
                        manage your existing pets first.
                      </p>
                    </div>

                    <div className='flex flex-wrap gap-3'>
                      <Link href='/pets' className={primaryButtonClassName()}>
                        Manage Pets
                      </Link>

                      <Link href='/pricing' className={secondaryButtonClassName()}>
                        Upgrade to VIP
                      </Link>

                      <Link href='/memories' className={secondaryButtonClassName()}>
                        Back to Memories
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form
                    action={createPetAction}
                    className='grid gap-6'
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
                        className={`${fieldClassName()} min-h-[128px]`}
                        name='dailyHabits'
                        placeholder='e.g. Loves waiting by the door, sleeps on the couch at night'
                        maxLength={500}
                      />
                    </label>

                    <label className='grid gap-2 text-sm font-bold text-stone-100'>
                      Upload Photo
                      <div className='rounded-[24px] border border-dashed border-amber-300/20 bg-gradient-to-b from-amber-300/6 to-white/4 px-6 py-8 text-center'>
                        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-2xl'>
                          📸
                        </div>

                        <p className='mt-4 text-sm font-extrabold text-amber-100'>
                          Supports JPG / PNG / WebP, max 5MB
                        </p>

                        <p className='mx-auto mt-2 max-w-xl text-xs leading-6 text-stone-400'>
                          The image will be uploaded to Supabase Storage and
                          attached to the pet profile.
                        </p>

                        <input
                          className='mt-5 block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-200 file:mr-4 file:rounded-full file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-sm file:font-bold file:text-stone-950 hover:file:brightness-105'
                          name='image'
                          type='file'
                          accept='image/png,image/jpeg,image/webp'
                          required
                        />
                      </div>
                    </label>

                    <div className='rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 text-sm leading-7 text-stone-300'>
                      After successful creation, EchoPaws will save your pet to
                      Supabase and automatically open the new pet chat with the
                      correct <span className='font-bold text-amber-200'>pet_id</span>.
                    </div>

                    <div className='flex flex-wrap gap-3 pt-1'>
                      <button type='submit' className={primaryButtonClassName()}>
                        Create Pet and Open Chat
                      </button>

                      <Link
                        href='/memories'
                        className={secondaryButtonClassName()}
                      >
                        Back to Memories
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            </section>
          </div>
        </main>

        <div className='relative z-10'>
          <SiteFooter text='© 2026 EchoPaws.ai. Create your first pet profile.' />
        </div>
      </div>
    </div>
  );
}
