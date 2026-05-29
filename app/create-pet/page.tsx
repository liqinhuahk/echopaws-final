import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createPetAction } from '@/app/actions/pets';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

type SearchParamsShape = {
  message?: string | string[];
  error?: string | string[];
};

type CreatePetPageProps = {
  searchParams?: Promise<SearchParamsShape> | SearchParamsShape;
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default async function CreatePetPage({ searchParams }: CreatePetPageProps) {
  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : undefined;

  const message = pickFirst(resolvedSearchParams?.message);
  const error = pickFirst(resolvedSearchParams?.error);

  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please+configure+Supabase+first.');
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
    redirect('/login?message=Please+log+in+to+continue.');
  }

  return (
    <>
      <SiteHeader ctaLabel='Open Memories' ctaHref='/memories' />

      <main className='container-shell py-10'>
        <section className='mx-auto max-w-3xl rounded-[32px] border border-orange-100 bg-white p-7 shadow-sm md:p-8'>
          <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
            Create Pet
          </div>

          <h1 className='mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl'>
            Create your AI pet profile
          </h1>

          <p className='mt-3 max-w-2xl text-sm leading-7 text-slate-600'>
            Fill in a few details so EchoPaws can start building memory, personality, and a warmer
            companionship style around your pet.
          </p>

          {message ? (
            <div className='mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
              {message}
            </div>
          ) : null}

          {error ? (
            <div className='mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
              {error}
            </div>
          ) : null}

          <form
            action={createPetAction}
            className='mt-6 grid gap-5'
            encType='multipart/form-data'
          >
            <label className='grid gap-2 text-sm font-bold'>
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

            <label className='grid gap-2 text-sm font-bold'>
              Breed
              <input
                className='input-shell'
                name='breed'
                type='text'
                placeholder='e.g. Shiba Inu'
                required
                maxLength={80}
              />
            </label>

            <label className='grid gap-2 text-sm font-bold'>
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

            <label className='grid gap-2 text-sm font-bold'>
              Favorite Food
              <input
                className='input-shell'
                name='favoriteFood'
                type='text'
                placeholder='e.g. Chicken breast, freeze-dried treats'
                maxLength={120}
              />
            </label>

            <label className='grid gap-2 text-sm font-bold'>
              Daily Habits
              <textarea
                className='input-shell min-h-[120px]'
                name='dailyHabits'
                placeholder='e.g. Loves waiting by the door, sleeps on the couch at night'
                maxLength={500}
              />
            </label>

            <label className='grid gap-2 text-sm font-bold'>
              Upload Photo
              <div className='rounded-[22px] border border-dashed border-orange-300 bg-gradient-to-b from-orange-50 to-amber-50 px-6 py-6 text-center text-amber-900'>
                <div className='text-3xl'>📷</div>
                <p className='mt-3 text-sm font-bold'>Supports JPG / PNG / WebP, max 5MB</p>
                <p className='mt-1 text-xs font-normal text-slate-600'>
                  The image will be stored with your pet profile and used to personalize the
                  experience.
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

              <Link
                href='/memories'
                className='rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50'
              >
                Back to Memories
              </Link>
            </div>
          </form>
        </section>
      </main>

      <SiteFooter rightText='EchoPaws · Create your first pet profile' />
    </>
  );
}
