'use client';

import Link from 'next/link';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, type Session, type User } from '@supabase/supabase-js';
import SiteHeader from '@/components/layout/SiteHeader';

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

function getFinalContinuePath(nextPath: string) {
  if (!nextPath || nextPath === '/login' || nextPath.startsWith('/login?')) {
    return '/';
  }
  return nextPath;
}

function getContinueLabel(path: string) {
  if (path === '/chat') return 'Continue to Chat';
  if (path === '/memories') return 'Continue to Memories';
  if (path === '/account') return 'Continue to Account';
  return 'Continue to Home';
}

function getDisplayName(user: User | null) {
  if (!user) return 'User';

  const meta = user.user_metadata ?? {};
  const fullName =
    meta.full_name ||
    meta.name ||
    meta.display_name ||
    meta.user_name ||
    meta.preferred_username;

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none">
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
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5.4 0 9 7 9 7a17.47 17.47 0 0 1-3.06 3.67" />
      <path d="M6.11 6.11C4.18 7.4 3 9 3 9s3.6 7 9 7c1.67 0 3.14-.46 4.4-1.15" />
    </svg>
  );
}

function StatusIcon({ status }: { status: StatusType }) {
  if (status === 'loading') {
    return (
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-[#f59e0b]" />
    );
  }

  if (status === 'success') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-emerald-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (status === 'error') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-rose-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-amber-200"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2.5 2.5" />
    </svg>
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
    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.15)] backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#efc27a]">
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-white/62">{description}</p>
    </div>
  );
}

function StatusPanel({
  status,
  title,
  detail,
  provider,
  userName,
  userEmail,
  continueLabel,
  canContinue,
  onContinue,
}: {
  status: StatusType;
  title: string;
  detail: string;
  provider: string;
  userName: string;
  userEmail: string;
  continueLabel: string;
  canContinue: boolean;
  onContinue: () => void;
}) {
  const panelClass =
    status === 'success'
      ? 'border-emerald-300/18 bg-[rgba(82,120,78,0.14)]'
      : status === 'error'
      ? 'border-rose-300/18 bg-[rgba(120,52,52,0.16)]'
      : status === 'loading'
      ? 'border-amber-300/18 bg-[rgba(120,89,42,0.16)]'
      : 'border-white/10 bg-white/[0.04]';

  return (
    <div className={`rounded-[22px] border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] ${panelClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={status} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-300/10 bg-emerald-400/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200/90">
              Status
            </span>
            {provider ? (
              <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] text-white/70">
                {provider}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm font-semibold text-white">{title}</p>

          {detail ? (
            <p className="mt-1 text-sm leading-6 text-white/65">{detail}</p>
          ) : null}

          {(userName || userEmail) && (
            <div className="mt-4 rounded-[18px] border border-white/10 bg-black/18 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/42">
                Signed-in Account
              </p>
              <p className="mt-2 text-sm font-medium text-white">{userName || '—'}</p>
              <p className="mt-1 break-all text-sm text-white/62">{userEmail || '—'}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-300/14 bg-emerald-400/8 px-2.5 py-1 text-[10px] text-emerald-200">
                  Login successful
                </span>
                {provider ? (
                  <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] text-white/65">
                    Method: {provider}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {canContinue && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] px-4 py-2.5 text-sm font-semibold text-[#2a1707] transition hover:brightness-105"
              >
                {continueLabel}
              </button>

              <Link
                href="/account"
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                View account
              </Link>
            </div>
          )}
        </div>
      </div>
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
  const continueLabel = useMemo(() => getContinueLabel(continuePath), [continuePath]);

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
  const [statusDetail, setStatusDetail] = useState(
    'Continue with Google or sign in with email and password.'
  );
  const [statusProvider, setStatusProvider] = useState('');

  const syncStatusFromUser = useCallback((user: User, providerOverride?: string) => {
    setStatus('success');
    setStatusTitle(`Signed in successfully as ${getDisplayName(user)}`);
    setStatusDetail('You can continue with this account now.');
    setStatusProvider(providerOverride || getProviderLabel(user));
  }, []);

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
      setStatusTitle('Redirecting back…');
      setStatusDetail('Checking your signed-in session now.');
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

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;

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
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
        options: { redirectTo },
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

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
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
          setStatus('success');
          setStatusTitle(`Signed in successfully as ${getDisplayName(data.user)}`);
          setStatusDetail('Email login completed. You can continue with this account now.');
          setStatusProvider('Email');
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
          setStatus('success');
          setStatusTitle(`Signed in successfully as ${getDisplayName(data.user)}`);
          setStatusDetail('Account created and signed in successfully.');
          setStatusProvider('Email');
        } else {
          setStatus('success');
          setStatusTitle('Account created');
          setStatusDetail(
            'Please check your email inbox and confirm your account before signing in.'
          );
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
  const showRedirectChip = continuePath && continuePath !== '/';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_14%_18%,rgba(255,120,20,0.24),transparent_18%),radial-gradient(circle_at_84%_28%,rgba(255,132,0,0.18),transparent_16%),linear-gradient(180deg,#120906_0%,#090304_42%,#060304_100%)] text-white">
      <SiteHeader
        isLoggedIn={!!currentUser}
        userName={currentName}
        userEmail={currentEmail}
        variant="overlay"
        contactHref="/contact"
      />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-12">
          <section className="relative z-10 flex min-h-[720px] flex-col justify-center">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-[#e6b46a]/18 bg-white/[0.04] px-4 py-1.5 text-[11px] uppercase tracking-[0.26em] text-[#efc27a]">
                Warm Luxury Login
              </span>

              <h1 className="mt-8 font-serif text-5xl font-semibold leading-[0.96] tracking-[-0.03em] text-white sm:text-6xl">
                Sign in with calm,
                <br />
                continue with <span className="text-[#f1b358]">comfort</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-white/62">
                A refined sign-in experience that stays aligned with the EchoPaws brand:
                warm, elegant, readable, and reassuring for everyday use.
              </p>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                <FeatureCard
                  title="Better Readability"
                  description="Cleaner hierarchy, softer contrast, and easier reading across the whole page."
                />
                <FeatureCard
                  title="Gentler Form Feel"
                  description="Softer surfaces, calmer spacing, and more comfortable inputs for daily use."
                />
                <FeatureCard
                  title="Safer Interaction"
                  description="Password visibility toggle, clearer feedback states, and more transparent login status."
                />
              </div>

              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.24em] text-[#efc27a]">
                    EchoPaws Feeling
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/45">
                    Home-aligned
                  </span>
                </div>

                <h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.02em] text-white">
                  Less noise, more trust
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                  The login page should always feel like part of the product, not just a utility
                  screen — calm to enter, clear to use, and consistent with the EchoPaws experience.
                </p>
              </div>
            </div>
          </section>

          <section className="relative z-10 flex items-start justify-center lg:justify-end">
            <div className="w-full max-w-[390px] rounded-[28px] border border-[rgba(255,190,110,0.10)] bg-[linear-gradient(180deg,rgba(40,18,10,0.95)_0%,rgba(25,12,8,0.96)_100%)] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3 px-1">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#efc27a]">
                  Auth
                </span>

                {showRedirectChip ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-white/45">
                    Redirect: {continuePath}
                  </span>
                ) : null}
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.04] p-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className={`rounded-full px-4 py-3 text-sm font-medium transition ${
                      mode === 'signin'
                        ? 'bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] text-[#2a1707] shadow-[0_10px_24px_rgba(245,158,11,0.35)]'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`rounded-full px-4 py-3 text-sm font-medium transition ${
                      mode === 'signup'
                        ? 'bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] text-[#2a1707] shadow-[0_10px_24px_rgba(245,158,11,0.35)]'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              <div className="mt-5 px-1">
                <h2 className="font-serif text-[42px] font-semibold leading-[0.96] tracking-[-0.03em] text-white">
                  Welcome back to your
                  <br />
                  companion space
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/62">
                  Continue with Google or sign in with email and password.
                </p>
              </div>

              <div className="mt-5">
                <StatusPanel
                  status={status}
                  title={statusTitle}
                  detail={statusDetail}
                  provider={statusProvider}
                  userName={currentName}
                  userEmail={currentEmail}
                  continueLabel={continueLabel}
                  canContinue={canContinue}
                  onContinue={handleContinue}
                />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={!supabase || isGoogleLoading}
                className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <GoogleIcon />
                )}
                <span>{isGoogleLoading ? 'Opening Google…' : 'Continue with Google'}</span>
              </button>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-[0.28em] text-white/35">
                  Or use email
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-white/55"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#eab25f]/40 focus:bg-white/[0.06]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-white/55"
                  >
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
                      className="w-full rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#eab25f]/40 focus:bg-white/[0.06]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-3 inline-flex items-center text-white/40 transition hover:text-white"
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
                      className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-white/55"
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
                      className="w-full rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#eab25f]/40 focus:bg-white/[0.06]"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="inline-flex items-center gap-2 text-white/62">
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
                      className="text-[#efc27a] transition hover:text-[#f5d399]"
                    >
                      Forgot password
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="text-[#efc27a] transition hover:text-[#f5d399]"
                    >
                      Already have an account
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!supabase || isEmailLoading}
                  className="inline-flex w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] px-4 py-3.5 text-sm font-semibold text-[#2a1707] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
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

              <div className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/45">
                {currentUser
                  ? `Current session: ${getDisplayName(currentUser)} · ${currentUser.email || 'No email'}`
                  : 'No active session yet. After Google or Email sign-in, this page will display your account name and login result here.'}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function LoginPageFallback() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_14%_18%,rgba(255,120,20,0.24),transparent_18%),linear-gradient(180deg,#120906_0%,#060304_100%)] text-white">
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
