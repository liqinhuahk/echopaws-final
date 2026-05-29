import { signInWithGoogle, signInWithPassword, signUpWithPassword } from '@/app/actions/auth';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

type LoginSearchParams = Promise<{
  message?: string | string[];
  error?: string | string[];
}>;

type LoginPageProps = {
  searchParams?: LoginSearchParams;
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  let message = '';
  let error = '';

  try {
    const resolvedSearchParams = (await searchParams) ?? {};
    message = pickFirst(resolvedSearchParams.message);
    error = pickFirst(resolvedSearchParams.error);
  } catch {
    message = '';
    error = '';
  }

  return (
    <>
      <SiteHeader ctaLabel='Get Started' ctaHref='/create-pet' />

      <main className='container-shell grid min-h-[calc(100vh-180px)] place-items-center py-12'>
        <section className='glass-card w-full max-w-[520px] p-7 md:p-8'>
          <div className='eyebrow'>Welcome to EchoPaws</div>

          <h1 className='page-title mt-4 text-[44px] md:text-[52px]'>
            Sign in to your companion world
          </h1>

          <p className='page-subtitle mx-0'>
            Sign in first, then create your AI pet. The whole flow is lightweight — you can be
            chatting within 3 minutes.
          </p>

          <div className='mt-6 grid gap-3'>
            <form action={signInWithGoogle}>
              <button type='submit' className='subtle-button w-full'>
                🔎 Sign in with Google
              </button>
            </form>

            <div className='rounded-2xl border border-black/5 bg-white px-4 py-3 text-center text-sm text-muted'>
              ✉️ Native email login — active after Supabase Auth is configured (see
              {' '}
              .env.local.example)
            </div>
          </div>

          <div className='my-5 flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-black/10 after:h-px after:flex-1 after:bg-black/10'>
            Or continue with email
          </div>

          {message ? (
            <div className='mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
              {message}
            </div>
          ) : null}

          {error ? (
            <div className='mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
              {error}
            </div>
          ) : null}

          <form action={signInWithPassword} className='grid gap-4'>
            <label className='grid gap-2 text-sm font-bold'>
              Email address
              <input
                className='input-shell'
                name='email'
                type='email'
                placeholder='name@example.com'
                autoComplete='email'
              />
            </label>

            <label className='grid gap-2 text-sm font-bold'>
              Password
              <input
                className='input-shell'
                name='password'
                type='password'
                placeholder='Enter your password'
                autoComplete='current-password'
              />
            </label>

            <label className='grid gap-2 text-sm font-bold'>
              Nickname (optional)
              <input
                className='input-shell'
                name='nickname'
                type='text'
                placeholder='What should your pet call you'
                autoComplete='nickname'
              />
            </label>

            <div className='grid gap-3 md:grid-cols-2'>
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

          <p className='mt-4 text-center text-xs text-muted'>
            No account yet? Create one to bring your first AI pet to life.
          </p>
        </section>
      </main>

      <SiteFooter rightText='Recommended Stack: Supabase Auth' />
    </>
  );
}
