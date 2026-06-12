'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, type Session, type User } from '@supabase/supabase-js';

type AuthMode = 'signin' | 'signup';
type StatusType = 'idle' | 'loading' | 'success' | 'error';

function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey);
}

function getSiteUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  const envSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://beta.echopaws.ai';

  return envSiteUrl.replace(/\/$/, '');
}

function getSafeNextPath(raw: string | null) {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

function getDisplayName(user: User | null) {
  if (!user) return 'Unknown User';

  const metadata = user.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    metadata.user_name ||
    metadata.preferred_username;

  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }

  if (user.email) {
    const [localPart] = user.email.split('@');
    if (localPart) return localPart;
  }

  return 'User';
}

function getProviderLabel(user: User | null) {
  if (!user) return 'Session';

  const provider =
    user.app_metadata?.provider ||
    user.identities?.[0]?.provider ||
    'email';

  if (provider === 'google') return 'Google';
  if (provider === 'email') return 'Email';
  return String(provider).charAt(0).toUpperCase() + String(provider).slice(1);
}

function getFinalContinuePath(nextPath: string) {
  if (!nextPath || nextPath === '/login' || nextPath.startsWith('/login?')) {
    return '/';
  }
  return nextPath;
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
    >
      <path
        d="M21.805 12.23c0-.78-.064-1.35-.202-1.94H12.24v3.58h5.495c-.11.89-.705 2.23-2.028 3.13l-.018.12 2.94 2.23.204.02c1.873-1.69 2.954-4.18 2.954-7.14Z"
        fill="#4285F4"
      />
      <path
        d="M12.24 21.75c2.69 0 4.949-.86 6.598-2.34l-3.144-2.37c-.842.57-1.97.97-3.454.97-2.635 0-4.867-1.69-5.663-4.03l-.115.01-3.058 2.31-.04.108c1.638 3.16 4.997 5.34 8.876 5.34Z"
        fill="#34A853"
      />
      <path
        d="M6.577 13.98a5.858 5.858 0 0 1-.331-1.98c0-.69.12-1.35.322-1.98l-.005-.132-3.096-2.35-.101.047A9.622 9.622 0 0 0 2.52 12c0 1.58.386 3.07 1.069 4.42l2.988-2.44Z"
        fill="#FBBC05"
      />
      <path
        d="M12.24 5.99c1.873 0 3.14.79 3.86 1.45l2.818-2.68C17.18 3.18 14.93 2.25 12.24 2.25c-3.88 0-7.238 2.18-8.876 5.34l3.202 2.44c.805-2.34 3.037-4.04 5.672-4.04Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5.4 0 9 7 9 7a17.47 17.47 0 0 1-3.06 3.67" />
      <path d="M6.11 6.11C4.18 7.4 3 9 3 9s3.6 7 9 7c1.67 0 3.14-.46 4.4-1.15" />
    </svg>
  );
}

function StatusIcon({ status }: { status: StatusType }) {
  if (status === 'loading') {
    return <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-[#f59e0b]" />;
  }

  if (status === 'success') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (status === 'error') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-sky-300" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2.5 2.5" />
    </svg>
  );
}

function StatusPanel({
  status,
  title,
  detail,
  provider,
  userName,
  userEmail,
  canContinue,
  onContinue,
}: {
  status: StatusType;
  title: string;
  detail: string;
  provider: string;
  userName: string;
  userEmail: string;
  canContinue: boolean;
  onContinue: () => void;
}) {
  const panelClass =
    status === 'success'
      ? 'border-emerald-400/25 bg-emerald-500/10'
      : status === 'error'
      ? 'border-rose-400/25 bg-rose-500/10'
      : status === 'loading'
      ? 'border-amber-400/25 bg-amber-500/10'
      : 'border-sky-400/20 bg-sky-500/10';

  return (
    <div className={`mb-5 rounded-2xl border p-4 shadow-lg backdrop-blur ${panelClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={status} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{title}</p>
            {provider ? (
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[11px] text-white/80">
                {provider}
              </span>
            ) : null}
          </div>

          {detail ? (
            <p className="mt-1 text-sm leading-6 text-white/75">{detail}</p>
          ) : null}

          {(userName || userEmail) && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Account Name</p>
                  <p className="mt-1 text-sm font-medium text-white">{userName || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Email</p>
                  <p className="mt-1 break-all text-sm font-medium text-white">{userEmail || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {canContinue && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center justify-center rounded-xl bg-[#f59e0b] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[#f7b84b]"
              >
                Continue
              </button>

              <Link
                href="/account"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10"
              >
                Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextParam = searchParams.get('next');
  const authHint = searchParams.get('auth');
  const oauthHint = searchParams.get('oauth');
  const oauthMessageHint = searchParams.get('message');

  const nextPath = useMemo(() => getSafeNextPath(nextParam), [nextParam]);
  const continuePath = useMemo(() => getFinalContinuePath(nextPath), [nextPath]);

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [mode, setMode] = useState<AuthMode>('signin');
  const [session, setSession] = useState<Session | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);

  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [status, setStatus] = useState<StatusType>('idle');
  const [statusTitle, setStatusTitle] = useState('Welcome back to your companion space');
  const [statusDetail, setStatusDetail] = useState('Sign in with Google or Email to continue where you left off.');
  const [statusProvider, setStatusProvider] = useState('Ready');

  const syncStatusFromUser = useCallback(
    (user: User, providerOverride?: string) => {
      setStatus('success');
      setStatusTitle(`Signed in as ${getDisplayName(user)}`);
      setStatusDetail(user.email || 'Authentication completed successfully.');
      setStatusProvider(providerOverride || getProviderLabel(user));
    },
    []
  );

  const handleContinue = useCallback(() => {
    router.push(continuePath);
  }, [continuePath, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedEmail = window.localStorage.getItem('echopaws-remembered-email') || '';
    const savedRemember = window.localStorage.getItem('echopaws-remember-email');

    if (savedEmail) setEmail(savedEmail);
    if (savedRemember !== null) setRememberEmail(savedRemember === 'true');
  }, []);

  useEffect(() => {
    if (!supabase) {
      setStatus('error');
      setStatusTitle('Auth client unavailable');
      setStatusDetail('Missing Supabase public environment variables.');
      setStatusProvider('Config');
      return;
    }

    let mounted = true;

    if (oauthHint === 'error') {
      setStatus('error');
      setStatusTitle('Google sign-in failed');
      setStatusDetail(oauthMessageHint || 'Unable to complete Google sign-in.');
      setStatusProvider('Google');
    } else if (authHint === 'google' && oauthHint === 'done') {
      setStatus('loading');
      setStatusTitle('Google sign-in completed');
      setStatusDetail('Syncing your account session…');
      setStatusProvider('Google');
    }

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setStatus('error');
        setStatusTitle('Failed to read session');
        setStatusDetail(error.message || 'Please refresh and try again.');
        setStatusProvider('Session');
        return;
      }

      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const provider =
          authHint === 'google' || oauthHint === 'done'
            ? 'Google'
            : getProviderLabel(currentSession.user);

        syncStatusFromUser(currentSession.user, provider);
        setIsGoogleLoading(false);
        setIsEmailLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);

      if (event === 'SIGNED_IN' && currentSession?.user) {
        const provider =
          authHint === 'google' || oauthHint === 'done'
            ? 'Google'
            : getProviderLabel(currentSession.user);

        syncStatusFromUser(currentSession.user, provider);
        setIsGoogleLoading(false);
        setIsEmailLoading(false);
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setStatus('idle');
        setStatusTitle('Welcome back to your companion space');
        setStatusDetail('Sign in with Google or Email to continue where you left off.');
        setStatusProvider('Ready');
        setIsGoogleLoading(false);
        setIsEmailLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [authHint, oauthHint, oauthMessageHint, supabase, syncStatusFromUser]);

  const handleGoogleSignIn = async () => {
    if (!supabase || isGoogleLoading) return;

    try {
      setIsGoogleLoading(true);
      setStatus('loading');
      setStatusTitle('Redirecting to Google sign-in…');
      setStatusDetail('Please complete account selection in the Google window.');
      setStatusProvider('Google');

      const siteUrl = getSiteUrl();
      const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}&auth=google`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setIsGoogleLoading(false);
      setStatus('error');
      setStatusTitle('Google sign-in failed');
      setStatusDetail(
        error instanceof Error ? error.message : 'Unable to start Google sign-in.'
      );
      setStatusProvider('Google');
    }
  };

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || isEmailLoading) return;

    if (!email.trim() || !password.trim()) {
      setStatus('error');
      setStatusTitle(mode === 'signin' ? 'Email sign-in failed' : 'Create account failed');
      setStatusDetail('Please enter both email and password.');
      setStatusProvider('Email');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setStatus('error');
      setStatusTitle('Create account failed');
      setStatusDetail('Password and Confirm Password do not match.');
      setStatusProvider('Email');
      return;
    }

    try {
      setIsEmailLoading(true);
      setStatus('loading');
      setStatusTitle(mode === 'signin' ? 'Signing in with email…' : 'Creating your account…');
      setStatusDetail(
        mode === 'signin'
          ? 'Verifying your credentials now.'
          : 'Preparing your EchoPaws account.'
      );
      setStatusProvider('Email');

      if (typeof window !== 'undefined') {
        if (rememberEmail) {
          window.localStorage.setItem('echopaws-remembered-email', email.trim());
          window.localStorage.setItem('echopaws-remember-email', 'true');
        } else {
          window.localStorage.removeItem('echopaws-remembered-email');
          window.localStorage.setItem('echopaws-remember-email', 'false');
        }
      }

      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.user) {
          setSession(data.session ?? null);
          syncStatusFromUser(data.user, 'Email');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${getSiteUrl()}/login?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (error) throw error;

        if (data.user && data.session) {
          setSession(data.session);
          syncStatusFromUser(data.user, 'Email');
        } else {
          setStatus('success');
          setStatusTitle('Account created');
          setStatusDetail('Please check your email inbox and confirm your account before signing in.');
          setStatusProvider('Email');
        }
      }
    } catch (error) {
      setStatus('error');
      setStatusTitle(mode === 'signin' ? 'Email sign-in failed' : 'Create account failed');
      setStatusDetail(error instanceof Error ? error.message : 'Authentication failed.');
      setStatusProvider('Email');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const currentUser = session?.user ?? null;
  const currentName = currentUser ? getDisplayName(currentUser) : '';
  const currentEmail = currentUser?.email || '';
  const canContinue = status === 'success' && !!currentUser;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),linear-gradient(180deg,#0b1220_0%,#111827_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-between rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl lg:p-10">
            <div>
              <div className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-medium tracking-[0.18em] text-amber-200">
                ECHOPAWS LOGIN
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Sign in with calm,
                <br />
                continue with comfort
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-white/70">
                Keep the login experience warm, clear, and reassuring. Google sign-in and
                Email sign-in now share the same visible status panel so users can always
                tell whether authentication succeeded and which account is active.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <FeatureCard
                  title="Clear success feedback"
                  description="After Google or Email sign-in, the page shows a clear signed-in state with account name and email."
                />
                <FeatureCard
                  title="Safer redirect flow"
                  description="Google OAuth returns to the login flow first, so the page can confirm success before continuing."
                />
                <FeatureCard
                  title="Less confusion"
                  description="Users no longer have to guess whether they are signed in when Google returns from account selection."
                />
                <FeatureCard
                  title="Gentle account overview"
                  description="The auth status card stays visible at the top of the form and highlights the active account identity."
                />
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-semibold text-white">Less noise, more trust</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                The login page should always answer three questions immediately:
                whether sign-in worked, which account is active, and where the user goes next.
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#0f172a]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-amber-200/80">
                  Companion Access
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                </h2>
              </div>

              <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    mode === 'signin'
                      ? 'bg-[#f59e0b] text-slate-950'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    mode === 'signup'
                      ? 'bg-[#f59e0b] text-slate-950'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            <StatusPanel
              status={status}
              title={statusTitle}
              detail={statusDetail}
              provider={statusProvider}
              userName={currentName}
              userEmail={currentEmail}
              canContinue={canContinue}
              onContinue={handleContinue}
            />

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={!supabase || isGoogleLoading}
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              ) : (
                <GoogleIcon />
              )}
              <span>{isGoogleLoading ? 'Opening Google…' : 'Continue with Google'}</span>
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-[0.22em] text-white/40">
                Or use email
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-amber-300/50 focus:bg-white/10"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/80">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-white/30 focus:border-amber-300/50 focus:bg-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 inline-flex items-center text-white/55 transition hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-white/80"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-amber-300/50 focus:bg-white/10"
                  />
                </div>
              )}

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400"
                  />
                  Remember my email
                </label>

                {mode === 'signin' ? (
                  <Link
                    href="/login"
                    className="text-sm text-amber-200/90 transition hover:text-amber-100"
                  >
                    Forgot password
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-left text-sm text-amber-200/90 transition hover:text-amber-100"
                  >
                    Already have an account
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!supabase || isEmailLoading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#f59e0b] px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-[#f7b84b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEmailLoading
                  ? mode === 'signin'
                    ? 'Signing In…'
                    : 'Creating Account…'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/60">
              <p>
                {currentUser
                  ? `Current session: ${getDisplayName(currentUser)} · ${currentUser.email || 'No email'}`
                  : 'No active session yet. After Google or Email sign-in, this page will show your account name and login result here.'}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function LoginPageFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#0b1220_0%,#111827_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
        <div className="w-full rounded-[28px] border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#f59e0b]" />
          <h1 className="text-2xl font-semibold">Loading login page…</h1>
          <p className="mt-3 text-sm text-white/65">
            Preparing secure sign-in and session status.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
