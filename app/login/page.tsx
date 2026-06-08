import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { LoginFormClient } from '@/components/login-form-client';

type SearchParamsValue = string | string[] | undefined;

type LoginPageProps = {
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

function pickFirst(value: SearchParamsValue) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : {};

  const message = pickFirst(resolvedSearchParams.message).trim();
  const error = pickFirst(resolvedSearchParams.error).trim();

  return (
    <div className='min-h-screen overflow-hidden bg-[#060504] text-[#f7efe5]'>
      <div className='pointer-events-none fixed inset-0'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,158,11,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_22%),linear-gradient(180deg,#0b0908_0%,#060504_48%,#050404_100%)]' />
        <div className='absolute left-[-10%] top-[6%] h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-3xl' />
        <div className='absolute right-[-8%] top-[10%] h-[22rem] w-[22rem] rounded-full bg-amber-300/8 blur-3xl' />
      </div>

      <div className='relative z-10 hidden md:block'>
        <SiteHeader theme='dark' ctaLabel='Get Started' ctaHref='/create-pet' />
      </div>

      <main className='container-shell relative z-10 py-8 md:py-10 lg:py-12'>
        <div className='grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)] lg:items-start xl:gap-10'>
          <section className='hidden lg:block'>
            <div className='sticky top-24 self-start'>
              <div className='max-w-xl pt-4'>
                <div className='inline-flex items-center gap-2 rounded-full border border-amber-300/16 bg-amber-300/10 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-amber-200'>
                  ✦ Welcome to EchoPaws
                </div>

                <h1 className='mt-5 text-[clamp(3rem,6vw,5.2rem)] font-black leading-[0.95] tracking-[-0.05em] text-white'>
                  Sign in to your
                  <br />
                  <span className='bg-gradient-to-r from-amber-300 via-orange-400 to-orange-500 bg-clip-text text-transparent'>
                    companion
                  </span>{' '}
                  world.
                </h1>

                <p className='mt-6 max-w-xl text-[1.05rem] leading-[1.9] text-stone-300'>
                  Keep the same warm EchoPaws feeling from the home page while entering
                  your account. Sign in first, then create or continue with your AI pet
                  in just a few steps.
                </p>

                <div className='mt-8 grid gap-3'>
                  <div className='rounded-[24px] border border-white/10 bg-white/[0.05] px-5 py-4 text-sm leading-7 text-stone-200 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl'>
                    <strong className='text-white'>Warm and familiar:</strong> a soft,
                    calm login experience that visually matches Home, Chat, Memories,
                    Account, and Pets.
                  </div>

                  <div className='rounded-[24px] border border-white/10 bg-white/[0.05] px-5 py-4 text-sm leading-7 text-stone-200 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl'>
                    <strong className='text-white'>Fast start:</strong> continue with
                    Google, or sign in with email after setting your password.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className='mx-auto w-full max-w-[560px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,17,13,0.92),rgba(11,9,8,0.92))] p-7 shadow-[0_24px_56px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-8 lg:mt-2'>
            <div className='text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-orange-300'>
              Welcome to EchoPaws
            </div>

            <h1 className='mt-4 text-[clamp(2.1rem,8vw,3rem)] font-black tracking-[-0.05em] text-white lg:hidden'>
              Sign in to your companion world
            </h1>

            <div className='mt-4 hidden lg:block'>
              <h2 className='text-[1.7rem] font-black tracking-[-0.04em] text-white'>
                Continue with your account
              </h2>
              <p className='mt-2 text-[0.98rem] leading-[1.8] text-stone-300'>
                Choose Google or email to continue. If this account was first created
                with Google, continue with Google or set a password first.
              </p>
            </div>

            <p className='mt-4 text-[0.98rem] leading-[1.85] text-stone-300 lg:hidden'>
              If this account was first created with Google, continue with Google or
              set a password first before using email sign-in.
            </p>

            {message ? (
              <div className='mt-6 rounded-2xl border border-emerald-400/18 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200'>
                {message}
              </div>
            ) : null}

            {error ? (
              <div className='mt-6 rounded-2xl border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100'>
                {error}
              </div>
            ) : null}

            <LoginFormClient />

            <p className='mt-5 text-center text-xs text-stone-500'>
              No account yet? Create one to bring your first AI pet to life.
            </p>
          </section>
        </div>
      </main>

      <div className='relative z-10'>
        <SiteFooter text='© 2026 EchoPaws.ai. All Rights Reserved.' />
      </div>
    </div>
  );
}
