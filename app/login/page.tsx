'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, type Session, type User } from '@supabase/supabase-js';
import SiteHeader from '@/components/site-header';

type AuthMode = 'signin' | 'signup';
type AuthProvider = 'google' | 'email' | 'session' | null;
type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return null;

  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

function getDisplayName(user: User | null) {
  if (!user) return '';

  const meta = user.user_metadata ?? {};
  const candidates = [
    typeof meta.full_name === 'string' ? meta.full_name : '',
    typeof meta.name === 'string' ? meta.name : '',
    typeof meta.display_name === 'string' ? meta.display_name : '',
    typeof meta.user_name === 'string' ? meta.user_name : '',
    user.email ?? '',
  ];

  return candidates.find((v) => v && v.trim())?.trim() ?? 'Signed-in user';
}

function getProviderLabel(provider: AuthProvider) {
  if (provider === 'google') return 'Google';
  if (provider === 'email') return 'Email & Password';
  if (provider === 'session') return 'Active Session';
  return 'Authentication';
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.25-.96 2.3-2.04 3.01l3.3 2.56c1.92-1.77 3.03-4.37 3.03-7.46 0-.71-.06-1.39-.18-2.04H12Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.3-2.56c-.91.61-2.08.97-3.45.97-2.65 0-4.9-1.79-5.7-4.19l-3.41 2.63A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#4A90E2"
        d="M6.3 13.75A5.99 5.99 0 0 1 6 12c0-.61.1-1.2.3-1.75L2.9 7.62A10 10 0 0 0 2 12c0 1.62.39 3.15 1.09 4.5l3.21-2.75Z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.98c1.5 0 2.85.52 3.91 1.54l2.93-2.93C17.05 2.91 14.74 2 12 2A10 10 0 0 0 3.09 7.5l3.41 2.75c.8-2.4 3.05-4.27 5.5-4.27Z"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.56" />
    </svg>
  );
}

function EyeIcon({ off = false }: { off?: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 3 18 18" />
      <path d="M10.58 10.59A2 2 0 0 0 13.4 13.4" />
      <path d="M9.88 5.09A9.77 9.77 0 0 1 12 4.88c5 0 9.27 3.11 11 7.5a11.83 11.83 0 0 1-4.17 5.94" />
      <path d="M6.61 6.61A11.79 11.79 0 0 0 1 12.38a11.83 11.83 0 0 0 7.5 6.78 10.86 10.86 0 0 0 4.18.1" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function StatusPanel({
  status,
  provider,
  title,
  detail,
  user,
  nextPath,
  onContinue,
}: {
  status: AuthStatus;
  provider: AuthProvider;
  title: string;
  detail: string;
  user: User | null;
  nextPath: string;
  onContinue: () => void;
}) {
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isLoading = status === 'loading';

  const displayName = getDisplayName(user);
  const email = user?.email ?? '';
  const providerLabel = getProviderLabel(provider);

  return (
    <div
      className={cn(
        'mb-5 rounded-[24px] border p-4 shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition',
        isSuccess &&
          'border-[rgba(104,211,145,0.22)] bg-[linear-gradient(180deg,rgba(64,120,77,0.18),rgba(22,36,24,0.28))]',
        isError &&
          'border-[rgba(255,120,120,0.2)] bg-[linear-gradient(180deg,rgba(120,40,40,0.18),rgba(38,14,14,0.28))]',
        isLoading &&
          'border-[rgba(255,180,103,0.22)] bg-[linear-gradient(180deg,rgba(124,71,25,0.18),rgba(30,16,9,0.28))]',
        status === 'idle' &&
          'border-[rgba(255,233,220,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]'
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            'inline-flex h-8 items-center rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.18em]',
            isSuccess && 'bg-[rgba(104,211,145,0.15)] text-[#b8f0c6]',
            isError && 'bg-[rgba(255,120,120,0.14)] text-[#ffd1d1]',
            isLoading && 'bg-[rgba(255,180,103,0.14)] text-[#ffd6ad]',
            status === 'idle' && 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,233,220,0.70)]'
          )}
        >
          {isSuccess
            ? 'Signed in'
            : isError
            ? 'Sign-in issue'
            : isLoading
            ? 'Authenticating'
            : 'Account status'}
        </span>

        <span className="text-xs text-[rgba(255,233,220,0.56)]">
          {provider ? providerLabel : 'Ready'}
        </span>
      </div>

      <div className="mt-3">
        <div className="text-[15px] font-semibold text-[#fff5ee]">{title}</div>
        <div className="mt-1 text-sm leading-6 text-[rgba(255,233,220,0.72)]">{detail}</div>
      </div>

      {isSuccess && user ? (
        <div className="mt-4 rounded-[18px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#efc39e]">
            Signed-in account
          </div>
          <div className="mt-2 text-base font-semibold text-[#fff5ee]">{displayName}</div>
          <div className="mt-1 text-sm text-[rgba(255,233,220,0.68)]">{email || 'No email found'}</div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[rgba(104,211,145,0.18)] bg-[rgba(104,211,145,0.10)] px-3 py-1 text-xs text-[#b8f0c6]">
              Login successful
            </span>
            <span className="rounded-full border border-[rgba(255,233,220,0.10)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs text-[rgba(255,233,220,0.66)]">
              Method: {providerLabel}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-4 text-sm font-semibold text-[#2f160c] shadow-[0_12px_24px_rgba(255,145,51,0.22)] transition hover:-translate-y-0.5"
            >
              Continue to {nextPath === '/' ? 'Home' : nextPath}
            </button>

            <Link
              href="/account"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-4 text-sm font-medium text-[#fff5ee] transition hover:bg-white/5"
            >
              View account
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-[#0b0706] text-[#f8efe8]">
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.82fr] lg:gap-10">
          <div className="min-h-[620px]" />
          <div className="rounded-[32px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(32,17,12,0.92),rgba(16,9,7,0.96))] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.26)]">
            <div className="flex items-center gap-3 text-sm text-[rgba(255,233,220,0.72)]">
              <Spinner />
              正在加载登录页面...
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [mode, setMode] = useState<AuthMode>('signin');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState<AuthStatus>('idle');
  const [statusProvider, setStatusProvider] = useState<AuthProvider>(null);
  const [statusTitle, setStatusTitle] = useState('Ready to sign in');
  const [statusDetail, setStatusDetail] = useState(
    'Choose Google or email and password. Your login result and account name will appear here.'
  );

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cached = window.localStorage.getItem('echopaws.rememberedEmail');
    if (cached) setEmail(cached);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!rememberEmail) {
      window.localStorage.removeItem('echopaws.rememberedEmail');
      return;
    }
    if (email.trim()) {
      window.localStorage.setItem('echopaws.rememberedEmail', email.trim());
    }
  }, [email, rememberEmail]);

  useEffect(() => {
    if (!supabase) {
      setStatus('error');
      setStatusTitle('Supabase is not configured');
      setStatusDetail('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        setStatus('error');
        setStatusTitle('Unable to read current session');
        setStatusDetail(error.message);
        return;
      }

      const currentSession = data.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const provider =
          currentSession.user.app_metadata?.provider === 'google' ? 'google' : 'session';
        setStatus('success');
        setStatusProvider(provider);
        setStatusTitle(`Already signed in as ${getDisplayName(currentSession.user)}`);
        setStatusDetail(
          `Your ${getProviderLabel(provider)} session is active. You can continue safely.`
        );
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (event === 'SIGNED_IN' && nextSession?.user) {
        const provider =
          nextSession.user.app_metadata?.provider === 'google' ? 'google' : 'email';

        setStatus('success');
        setStatusProvider(provider);
        setStatusTitle(`Signed in successfully as ${getDisplayName(nextSession.user)}`);
        setStatusDetail(
          `${getProviderLabel(provider)} login completed. You can continue with this account now.`
        );
        setIsGoogleLoading(false);
        setIsEmailLoading(false);
      }

      if (event === 'SIGNED_OUT') {
        setStatus('idle');
        setStatusProvider(null);
        setStatusTitle('Ready to sign in');
        setStatusDetail(
          'Choose Google or email and password. Your login result and account name will appear here.'
        );
        setIsGoogleLoading(false);
        setIsEmailLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleContinue = () => {
    router.push(nextPath);
  };

  const handleGoogleSignIn = async () => {
    if (!supabase || isGoogleLoading) return;

    try {
      setIsGoogleLoading(true);
      setStatus('loading');
      setStatusProvider('google');
      setStatusTitle('Redirecting to Google sign-in');
      setStatusDetail('Please complete the Google authorization window. We will show your account name here after you return.');

      const siteUrl = getSiteUrl();
      const redirectTo = `${siteUrl}/login?next=${encodeURIComponent(nextPath)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed.';
      setStatus('error');
      setStatusProvider('google');
      setStatusTitle('Google sign-in failed');
      setStatusDetail(message);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || isEmailLoading) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setStatus('error');
      setStatusProvider('email');
      setStatusTitle(mode === 'signin' ? 'Sign-in information incomplete' : 'Account creation information incomplete');
      setStatusDetail('Please enter both your email address and password.');
      return;
    }

    try {
      setIsEmailLoading(true);
      setStatus('loading');
      setStatusProvider('email');
      setStatusTitle(mode === 'signin' ? 'Signing in with email' : 'Creating your account');
      setStatusDetail('Please wait while we verify your email and password.');

      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (data.user) {
          setUser(data.user);
          setSession(data.session ?? null);
          setStatus('success');
          setStatusProvider('email');
          setStatusTitle(`Signed in successfully as ${getDisplayName(data.user)}`);
          setStatusDetail('Email & Password login completed successfully.');
        }
      } else {
        const siteUrl = getSiteUrl();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${siteUrl}/login?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (error) throw error;

        if (data.user) {
          setUser(data.user);
        }

        if (data.session) {
          setSession(data.session);
          setStatus('success');
          setStatusProvider('email');
          setStatusTitle(`Account created and signed in as ${getDisplayName(data.user ?? null)}`);
          setStatusDetail('Your account has been created and is already active.');
        } else {
          setStatus('success');
          setStatusProvider('email');
          setStatusTitle('Account created successfully');
          setStatusDetail(
            'Please check your inbox for verification mail if confirmation is required before sign-in.'
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email authentication failed.';
      setStatus('error');
      setStatusProvider('email');
      setStatusTitle(mode === 'signin' ? 'Email sign-in failed' : 'Account creation failed');
      setStatusDetail(message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const featureItems = [
    {
      title: 'Better Readability',
      text: 'Clearer hierarchy, softer contrast, and easier reading across the whole page.',
    },
    {
      title: 'Gentler Form Feel',
      text: 'Softer surfaces, calmer spacing, and more comfortable inputs for daily use.',
    },
    {
      title: 'Safer Interaction',
      text: 'Password visibility toggle, clearer feedback states, and more transparent login status.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0706] text-[#f8efe8]">
      <SiteHeader />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,140,48,0.18),transparent_22%),radial-gradient(circle_at_84%_14%,rgba(255,170,82,0.10),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(255,110,52,0.08),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:44px_44px]"
      />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.82fr] lg:gap-10">
          <section className="flex min-h-[620px] items-center">
            <div className="w-full">
              <div className="inline-flex items-center rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#efc39e]">
                Warm Luxury Login
              </div>

              <h1 className="mt-6 max-w-[680px] font-serif text-5xl leading-[0.94] tracking-[-0.05em] text-[#fff5ee] sm:text-6xl">
                Sign in with calm,
                <br />
                continue with
                <span className="bg-[linear-gradient(180deg,#ffd59d,#ff9b37)] bg-clip-text text-transparent">
                  {' '}
                  comfort
                </span>
              </h1>

              <p className="mt-6 max-w-[640px] text-[15px] leading-8 text-[rgba(255,233,220,0.72)]">
                A refined sign-in experience that stays aligned with the EchoPaws home theme: warm,
                elegant, readable, and reassuring for everyday use.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {featureItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[24px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#efc39e]">
                      {item.title}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[rgba(255,233,220,0.70)]">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[28px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#efc39e]">
                    EchoPaws feeling
                  </div>
                  <span className="rounded-full border border-[rgba(255,233,220,0.10)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[10px] text-[rgba(255,233,220,0.60)]">
                    Home-aligned
                  </span>
                </div>

                <div className="mt-3 font-serif text-3xl tracking-[-0.04em] text-[#fff5ee]">
                  Less noise, more trust
                </div>
                <p className="mt-4 max-w-[680px] text-sm leading-8 text-[rgba(255,233,220,0.70)]">
                  This page is designed to feel like part of the product, not just a utility screen —
                  calm to enter, clear to use, and consistent with the rest of the EchoPaws experience.
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center">
            <div className="w-full rounded-[32px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(32,17,12,0.92),rgba(16,9,7,0.96))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.26)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex h-8 items-center rounded-full border border-[rgba(255,233,220,0.10)] bg-[rgba(255,255,255,0.03)] px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#efc39e]">
                  Auth
                </div>

                <span className="rounded-full border border-[rgba(255,233,220,0.10)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[10px] text-[rgba(255,233,220,0.60)]">
                  Redirect → {nextPath}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 rounded-full border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] p-1">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={cn(
                    'inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition',
                    mode === 'signin'
                      ? 'bg-[linear-gradient(180deg,#ffcd88,#ff9f3f)] text-[#2f160c] shadow-[0_10px_22px_rgba(255,145,51,0.20)]'
                      : 'text-[rgba(255,233,220,0.70)] hover:text-white'
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={cn(
                    'inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition',
                    mode === 'signup'
                      ? 'bg-[linear-gradient(180deg,#ffcd88,#ff9f3f)] text-[#2f160c] shadow-[0_10px_22px_rgba(255,145,51,0.20)]'
                      : 'text-[rgba(255,233,220,0.70)] hover:text-white'
                  )}
                >
                  Create Account
                </button>
              </div>

              <div className="mt-5">
                <h2 className="font-serif text-4xl tracking-[-0.04em] text-[#fff5ee]">
                  {mode === 'signin' ? 'Welcome back to your companion space' : 'Create your calm companion account'}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[rgba(255,233,220,0.68)]">
                  {mode === 'signin'
                    ? 'Continue with Google or sign in with email and password.'
                    : 'Use Google or create an account with your email and password.'}
                </p>
              </div>

              <StatusPanel
                status={status}
                provider={statusProvider}
                title={statusTitle}
                detail={statusDetail}
                user={user}
                nextPath={nextPath}
                onContinue={handleContinue}
              />

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[rgba(255,233,220,0.10)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-medium text-[#fff5ee] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isGoogleLoading ? <Spinner /> : <GoogleIcon />}
                <span>{isGoogleLoading ? 'Opening Google...' : 'Continue with Google'}</span>
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-[rgba(255,233,220,0.08)]" />
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgba(255,233,220,0.40)]">
                  Or use email
                </div>
                <div className="h-px flex-1 bg-[rgba(255,233,220,0.08)]" />
              </div>

              <form onSubmit={handleEmailSubmit}>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.20em] text-[#efc39e]">
                    Email address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-2xl border border-[rgba(255,233,220,0.12)] bg-white/[0.04] px-4 text-sm text-[#fff5ee] outline-none placeholder:text-[rgba(255,233,220,0.35)] transition focus:border-[rgba(255,180,103,0.35)]"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.20em] text-[#efc39e]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
                      className="h-12 w-full rounded-2xl border border-[rgba(255,233,220,0.12)] bg-white/[0.04] px-4 pr-12 text-sm text-[#fff5ee] outline-none placeholder:text-[rgba(255,233,220,0.35)] transition focus:border-[rgba(255,180,103,0.35)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-[rgba(255,233,220,0.48)] transition hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon off={showPassword} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[rgba(255,233,220,0.72)]">
                    <input
                      type="checkbox"
                      checked={rememberEmail}
                      onChange={(e) => setRememberEmail(e.target.checked)}
                      className="h-4 w-4 rounded border-[rgba(255,233,220,0.18)] bg-transparent accent-[#ffac58]"
                    />
                    Remember my email
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm text-[rgba(255,233,220,0.68)] transition hover:text-white"
                  >
                    Forgot password
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isEmailLoading}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[linear-gradient(180deg,#ffd092,#ff9a35)] px-5 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.30)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isEmailLoading ? <Spinner /> : null}
                  <span>
                    {isEmailLoading
                      ? mode === 'signin'
                        ? 'Signing in...'
                        : 'Creating account...'
                      : mode === 'signin'
                      ? 'Sign In'
                      : 'Create Account'}
                  </span>
                </button>
              </form>

              <div className="mt-5 rounded-[20px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.02)] p-4 text-sm leading-7 text-[rgba(255,233,220,0.60)]">
                If your account was originally created with Google, it is best to continue with Google first.
                Your signed-in account name and email will appear above as soon as the login succeeds.
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
