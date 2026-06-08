import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from '@/app/actions/auth';
import { PasswordInput } from '@/components/password-input';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

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

function GoogleLogo() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 48 48'
      className='h-5 w-5'
      aria-hidden='true'
    >
      <path
        fill='#FFC107'
        d='M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.203 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z'
      />
      <path
        fill='#FF3D00'
        d='M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z'
      />
      <path
        fill='#4CAF50'
        d='M24 44c5.17 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.148 35.091 26.715 36 24 36c-5.182 0-9.625-3.329-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z'
      />
      <path
        fill='#1976D2'
        d='M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 01-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z'
      />
    </svg>
  );
}

function fieldClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-stone-500 outline-none transition focus:border-amber-300/35 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10';
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

      <main className='container-shell relative z-10 py-10 md:py-14'>
        <div className='grid min-h-[calc(100vh-180px)] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]'>
          <section className='hidden lg:block'>
            <div className='max-w-xl'>
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
                  <strong className='text-white'>Fast start:</strong> sign in with
                  Google or email, then create your AI pet and begin chatting in just a
                  few minutes.
                </div>
              </div>
            </div>
          </section>

          <section className='mx-auto w-full max-w-[560px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,17,13,0.92),rgba(11,9,8,0.92))] p-7 shadow-[0_24px_56px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-8'>
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
                Choose Google or email to continue. After signing in, you can return to
                your pet, memories, and ongoing conversations right away.
              </p>
            </div>

            <p className='mt-4 text-[0.98rem] leading-[1.85] text-stone-300 lg:hidden'>
              Sign in first, then create your AI pet. The whole flow is lightweight —
              you can be chatting within minutes.
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

            <div className='mt-6 grid gap-3'>
              <form action={signInWithGoogle}>
                <button
                  type='submit'
                  className='flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition hover:bg-white/[0.08]'
                >
                  <GoogleLogo />
                  <span>Sign in with Google</span>
                </button>
              </form>

              <div className='rounded-2xl border border-amber-300/12 bg-amber-300/8 px-4 py-3 text-center text-sm leading-7 text-stone-200'>
                Continue with Google for the fastest setup, or use email below to sign
                in and create your EchoPaws account.
              </div>
            </div>

            <div className='my-5 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-stone-500 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10'>
              Or continue with email
            </div>

            <form action={signInWithPassword} className='grid gap-4'>
              <label className='grid gap-2 text-sm font-bold text-stone-100'>
                Email address
                <input
                  className={fieldClassName()}
                  name='email'
                  type='email'
                  placeholder='name@example.com'
                  autoComplete='email'
                  required
                />
              </label>

              <label className='grid gap-2 text-sm font-bold text-stone-100'>
                Password
                <PasswordInput
                  name='password'
                  placeholder='Enter your password'
                  autoComplete='current-password'
                  required
                />
              </label>

              <label className='grid gap-2 text-sm font-bold text-stone-100'>
                Nickname (optional)
                <input
                  className={fieldClassName()}
                  name='nickname'
                  type='text'
                  placeholder='What should your pet call you'
                  autoComplete='nickname'
                />
              </label>

              <div className='grid gap-3 pt-1 md:grid-cols-2'>
                <button type='submit' className='brand-button w-full'>
                  Sign In
                </button>

                <button
                  type='submit'
                  formAction={signUpWithPassword}
                  className='subtle-button w-full'
                >
                  Create Account
                </button>
              </div>
            </form>

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
