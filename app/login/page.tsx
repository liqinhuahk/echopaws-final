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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : {};

  const message = pickFirst(resolvedSearchParams.message).trim();
  const error = pickFirst(resolvedSearchParams.error).trim();

  return (
    <div className='app-brand-backdrop'>
      <div className='hidden md:block'>
        <SiteHeader ctaLabel='Get Started' ctaHref='/create-pet' />
      </div>

      <main className='container-shell py-10 md:py-14'>
        <div className='grid min-h-[calc(100vh-180px)] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]'>
          <section className='hidden lg:block'>
            <div className='max-w-xl'>
              <div className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/90 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-orange-700'>
                🐾 Welcome to EchoPaws
              </div>

              <h1 className='mt-5 text-[clamp(3rem,6vw,5.2rem)] font-black leading-[0.95] tracking-[-0.05em] text-slate-900'>
                Sign in to your
                <br />
                <span className='text-orange-500'>companion</span> world.
              </h1>

              <p className='mt-6 max-w-xl text-[1.05rem] leading-[1.9] text-slate-600'>
                Keep the same warm EchoPaws feeling from the home page while entering
                your account. Sign in first, then create or continue with your AI pet
                in just a few steps.
              </p>

              <div className='mt-8 grid gap-3'>
                <div className='rounded-[24px] border border-white/55 bg-white/78 px-5 py-4 text-sm leading-7 text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.06)] backdrop-blur-md'>
                  <strong className='text-slate-900'>Warm and familiar:</strong>{' '}
                  a soft, calm login experience that visually matches Home, Chat,
                  Memories, Account, and Pets.
                </div>

                <div className='rounded-[24px] border border-white/55 bg-white/78 px-5 py-4 text-sm leading-7 text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.06)] backdrop-blur-md'>
                  <strong className='text-slate-900'>Fast start:</strong> sign in with
                  Google or email, then create your AI pet and begin chatting in just a
                  few minutes.
                </div>
              </div>
            </div>
          </section>

          <section className='mx-auto w-full max-w-[560px] rounded-[32px] border border-white/55 bg-white/80 p-7 shadow-[0_20px_48px_rgba(15,23,42,0.10)] backdrop-blur-md md:p-8'>
            <div className='eyebrow'>Welcome to EchoPaws</div>

            <h1 className='mt-4 text-[clamp(2.1rem,8vw,3rem)] font-black tracking-[-0.05em] text-slate-900 lg:hidden'>
              Sign in to your companion world
            </h1>

            <div className='mt-4 hidden lg:block'>
              <h2 className='text-[1.7rem] font-black tracking-[-0.04em] text-slate-900'>
                Continue with your account
              </h2>
              <p className='mt-2 text-[0.98rem] leading-[1.8] text-slate-600'>
                Choose Google or email to continue. After signing in, you can return to
                your pet, memories, and ongoing conversations right away.
              </p>
            </div>

            <p className='mt-4 text-[0.98rem] leading-[1.85] text-slate-600 lg:hidden'>
              Sign in first, then create your AI pet. The whole flow is lightweight —
              you can be chatting within minutes.
            </p>

            {message ? (
              <div className='mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
                {message}
              </div>
            ) : null}

            {error ? (
              <div className='mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
                {error}
              </div>
            ) : null}

            <div className='mt-6 grid gap-3'>
              <form action={signInWithGoogle}>
                <button
                  type='submit'
                  className='subtle-button flex w-full items-center justify-center gap-3 !min-h-[52px]'
                >
                  <GoogleLogo />
                  <span>Sign in with Google</span>
                </button>
              </form>

              <div className='rounded-2xl border border-orange-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-center text-sm leading-7 text-slate-700'>
                Continue with Google for the fastest setup, or use email below to sign
                in and create your EchoPaws account.
              </div>
            </div>

            <div className='my-5 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-muted before:h-px before:flex-1 before:bg-black/10 after:h-px after:flex-1 after:bg-black/10'>
              Or continue with email
            </div>

            <form action={signInWithPassword} className='grid gap-4'>
              <label className='grid gap-2 text-sm font-bold text-slate-800'>
                Email address
                <input
                  className='input-shell'
                  name='email'
                  type='email'
                  placeholder='name@example.com'
                  autoComplete='email'
                  required
                />
              </label>

              <label className='grid gap-2 text-sm font-bold text-slate-800'>
                Password
                <PasswordInput
                  name='password'
                  placeholder='Enter your password'
                  autoComplete='current-password'
                  required
                />
              </label>

              <label className='grid gap-2 text-sm font-bold text-slate-800'>
                Nickname (optional)
                <input
                  className='input-shell'
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

            <p className='mt-5 text-center text-xs text-muted'>
              No account yet? Create one to bring your first AI pet to life.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter text='© 2026 EchoPaws.ai. All Rights Reserved.' />
    </div>
  );
}
