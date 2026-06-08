import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from '@/app/actions/auth';
import { PasswordInput } from '@/components/password-input';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;
type LoginPageProps = {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
};

function pickFirst(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

function GoogleLogo() {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      className='h-4 w-4'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M21.805 12.23c0-.69-.062-1.353-.177-1.99H12v3.768h5.503a4.708 4.708 0 0 1-2.043 3.09v2.565h3.303c1.934-1.78 3.042-4.404 3.042-7.433Z'
        fill='#4285F4'
      />
      <path
        d='M12 22c2.76 0 5.076-.916 6.768-2.48l-3.303-2.565c-.916.614-2.086.978-3.465.978-2.664 0-4.922-1.8-5.727-4.218H2.86v2.646A9.997 9.997 0 0 0 12 22Z'
        fill='#34A853'
      />
      <path
        d='M6.273 13.715A5.993 5.993 0 0 1 5.955 12c0-.595.103-1.174.318-1.715V7.64H2.86A9.997 9.997 0 0 0 2 12c0 1.61.385 3.134 1.06 4.36l3.213-2.645Z'
        fill='#FBBC05'
      />
      <path
        d='M12 6.067c1.5 0 2.846.515 3.907 1.526l2.93-2.93C17.07 3.02 14.754 2 12 2A9.997 9.997 0 0 0 2.86 7.64l3.413 2.645C7.078 7.867 9.336 6.067 12 6.067Z'
        fill='#EA4335'
      />
    </svg>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const message = pickFirst(resolvedSearchParams.message)?.trim() ?? '';
  const error = pickFirst(resolvedSearchParams.error)?.trim() ?? '';

  return (
    <div className='app-brand-backdrop'>
      <SiteHeader theme='dark' ctaLabel='Get Started' ctaHref='/create-pet' />

      <main className='container-shell py-8 md:py-10'>
        <section className='grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center'>
          <div className='space-y-6'>
            <div className='eyebrow'>✦ Welcome to EchoPaws</div>

            <div className='max-w-[620px]'>
              <h1 className='page-title text-[clamp(3rem,8vw,6rem)] leading-[0.92]'>
                Sign in to your
                <br />
                <span className='bg-gradient-to-r from-amber-300 via-orange-400 to-orange-500 bg-clip-text text-transparent'>
                  companion
                </span>
                <br />
                world.
              </h1>

              <p className='page-subtitle mt-6 max-w-[560px] text-[1.02rem] leading-[1.95]'>
                Keep the same warm EchoPaws feeling from Home while entering your account. Sign in
                first, then create or continue with your AI pet in just a few steps.
              </p>
            </div>

            <div className='grid gap-4'>
              <div className='dark-shell-panel p-5'>
                <div className='text-sm font-bold text-[rgba(255,244,230,0.92)]'>
                  Warm and familiar
                </div>
                <p className='mt-2 text-sm leading-7 text-[rgba(255,244,230,0.68)]'>
                  A soft, calm login experience that visually matches Home, Chat, Memories,
                  Account, and Pets.
                </p>
              </div>

              <div className='dark-shell-panel p-5'>
                <div className='text-sm font-bold text-[rgba(255,244,230,0.92)]'>Fast start</div>
                <p className='mt-2 text-sm leading-7 text-[rgba(255,244,230,0.68)]'>
                  Sign in with Google or email, then create your AI pet and begin chatting in just
                  a few minutes.
                </p>
              </div>
            </div>
          </div>

          <section className='glass-card p-6 md:p-8'>
            <div className='eyebrow'>Welcome to EchoPaws</div>
            <h2 className='mt-5 text-3xl font-black tracking-[-0.04em] text-[color:#fff7ed]'>
              Continue with your account
            </h2>
            <p className='mt-4 text-sm leading-7 text-[rgba(255,244,230,0.72)]'>
              Choose Google or email to continue. If this account was first created with Google,
              continue with Google or set a password first.
            </p>

            {message ? (
              <div className='mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200'>
                {message}
              </div>
            ) : null}

            {error ? (
              <div className='mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
                {error}
              </div>
            ) : null}

            <form action={signInWithGoogle} className='mt-5'>
              <button
                type='submit'
                className='subtle-button w-full gap-2 border-white/12 bg-white/6 text-white'
              >
                <GoogleLogo />
                Continue with Google
              </button>
            </form>

            <div className='mt-4 rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-center text-sm leading-7 text-[rgba(255,244,230,0.62)]'>
              If you first created this account with Google, continue with Google.
              <br />
              If you want to use email sign-in later, set a password first.
            </div>

            <div className='mt-6 flex items-center gap-4'>
              <div className='h-px flex-1 bg-white/10' />
              <div className='text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[rgba(255,244,230,0.34)]'>
                Or continue with email
              </div>
              <div className='h-px flex-1 bg-white/10' />
            </div>

            <form action={signInWithPassword} className='mt-6 grid gap-4'>
              <label className='grid gap-2'>
                <span className='text-sm font-bold text-[rgba(255,244,230,0.86)]'>Email address</span>
                <input type='email' name='email' placeholder='name@example.com' required />
              </label>

              <label className='grid gap-2'>
                <span className='text-sm font-bold text-[rgba(255,244,230,0.86)]'>Password</span>
                <PasswordInput name='password' placeholder='Enter your password' required />
              </label>

              <label className='grid gap-2'>
                <span className='text-sm font-bold text-[rgba(255,244,230,0.86)]'>Nickname (optional)</span>
                <input type='text' name='nickname' placeholder='What should your pet call you' />
              </label>

              <div className='grid gap-3 sm:grid-cols-2'>
                <button type='submit' className='brand-button w-full'>
                  Sign In
                </button>

                <button formAction={signUpWithPassword} type='submit' className='subtle-button w-full'>
                  Create Account
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>

      <SiteFooter text='© 2026 EchoPaws.ai. All Rights Reserved.' />
    </div>
  );
}
