'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SiteHeader from '@/components/site-header';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const AUTH_CALLBACK_PATH = '/auth/callback';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function AuthFeature({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.016))] px-5 py-4 shadow-[0_12px_36px_rgba(0,0,0,0.18)]">
      <div className="text-[13px] font-extrabold text-white">{title}</div>
      <div className="mt-1.5 text-sm leading-7 text-[rgba(255,244,230,0.70)]">{body}</div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-[#0b0706] text-[#f7efe8]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,122,26,0.11),transparent_23%),radial-gradient(circle_at_86%_12%,rgba(255,185,94,0.08),transparent_18%),linear-gradient(180deg,#0b0706_0%,#130907_52%,#0b0706_100%)]" />
      <SiteHeader theme="dark" />
      <main className="relative z-[1] mx-auto w-full max-w-[1240px] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="max-w-[640px]">
            <div className="inline-flex items-center rounded-full border border-amber-300/16 bg-amber-300/8 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f3c86b]">
              Softer sign-in experience
            </div>

            <h1
              className="mt-5 text-[clamp(3rem,7vw,5.7rem)] leading-[0.92] tracking-[-0.055em] text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Return to your{' '}
              <span className="bg-[linear-gradient(90deg,#ffcf85_0%,#ffaf57_45%,#ff8c2b_100%)] bg-clip-text text-transparent">
                companion
              </span>{' '}
              world
            </h1>

            <p className="mt-5 max-w-[560px] text-[16px] leading-8 text-[rgba(255,244,230,0.74)]">
              A calmer sign-in experience is loading...
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="h-[110px] animate-pulse rounded-[24px] bg-white/[0.04]" />
              <div className="h-[110px] animate-pulse rounded-[24px] bg-white/[0.04]" />
            </div>
          </div>

          <div className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(34,20,16,0.92),rgba(16,10,8,0.94))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-7">
            <div className="h-10 animate-pulse rounded-full bg-white/[0.05]" />
            <div className="mt-5 h-14 animate-pulse rounded-[18px] bg-white/[0.05]" />
            <div className="mt-4 h-14 animate-pulse rounded-[18px] bg-white/[0.05]" />
            <div className="mt-4 h-14 animate-pulse rounded-[18px] bg-white/[0.05]" />
            <div className="mt-5 h-14 animate-pulse rounded-full bg-white/[0.05]" />
          </div>
        </section>
      </main>
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const queryMessage = searchParams.get('message');
  const queryError = searchParams.get('error');
  const nextHref = searchParams.get('next') || '/chat';

  const supabase = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }, []);

  const bannerText = localError || queryError || successMessage || queryMessage || null;
  const bannerTone =
    localError || queryError
      ? 'error'
      : successMessage
      ? 'success'
      : queryMessage
      ? 'neutral'
      : null;

  const callbackUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(nextHref)}`
      : undefined;

  async function handleGoogleSignIn() {
    if (!supabase) {
      setLocalError('Supabase client is not configured. Please check your NEXT_PUBLIC environment variables.');
      return;
    }

    setLoading(true);
    setLocalError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: callbackUrl
          ? {
              redirectTo: callbackUrl,
            }
          : undefined,
      });

      if (error) {
        setLocalError(error.message);
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setLocalError('Supabase client is not configured. Please check your NEXT_PUBLIC environment variables.');
      return;
    }

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setLocalError('Please enter your password.');
      return;
    }

    setLoading(true);
    setLocalError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setLocalError(error.message);
          return;
        }

        router.push(nextHref);
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nickname: nickname.trim() || null,
          },
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        setLocalError(error.message);
        return;
      }

      if (data.session) {
        router.push(nextHref);
        router.refresh();
        return;
      }

      setSuccessMessage('Account created. Please check your email to confirm your sign-up before continuing.');
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!supabase) {
      setLocalError('Supabase client is not configured. Please check your NEXT_PUBLIC environment variables.');
      return;
    }

    if (!email.trim()) {
      setLocalError('Enter your email first, then we can send a reset link.');
      return;
    }

    setResetting(true);
    setLocalError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: callbackUrl,
      });

      if (error) {
        setLocalError(error.message);
        return;
      }

      setSuccessMessage('Password reset link sent. Please check your inbox.');
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Could not send password reset email.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0706] text-[#f7efe8]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,122,26,0.11),transparent_23%),radial-gradient(circle_at_86%_12%,rgba(255,185,94,0.08),transparent_18%),linear-gradient(180deg,#0b0706_0%,#130907_52%,#0b0706_100%)]" />

      <SiteHeader theme="dark" />

      <main className="relative z-[1] mx-auto w-full max-w-[1240px] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="max-w-[640px]">
            <div className="inline-flex items-center rounded-full border border-amber-300/16 bg-amber-300/8 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f3c86b]">
              Softer sign-in experience
            </div>

            <h1
              className="mt-5 text-[clamp(3rem,7vw,5.7rem)] leading-[0.92] tracking-[-0.055em] text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Return to your{' '}
              <span className="bg-[linear-gradient(90deg,#ffcf85_0%,#ffaf57_45%,#ff8c2b_100%)] bg-clip-text text-transparent">
                companion
              </span>{' '}
              world
            </h1>

            <p className="mt-5 max-w-[560px] text-[16px] leading-8 text-[rgba(255,244,230,0.74)]">
              A warmer, calmer entry point that feels like a natural continuation of Home — less like a campaign page, more like a comfortable place to sign in and continue your relationship with your pet.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <AuthFeature
                title="Calmer visual rhythm"
                body="Reduced headline pressure, softer contrast, and more breathing room so the page feels reassuring rather than loud."
              />
              <AuthFeature
                title="Better form readability"
                body="Dark glass inputs, clearer labels, and more consistent spacing for easier typing and lower visual fatigue."
              />
            </div>

            <div className="mt-5 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.026),rgba(255,255,255,0.014))] px-5 py-4 text-sm leading-7 text-[rgba(255,244,230,0.72)] shadow-[0_12px_36px_rgba(0,0,0,0.16)]">
              Sign in first, then continue with Chat, Memories, Account, and your pet setup in one unified visual flow.
            </div>
          </div>

          <div className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(34,20,16,0.92),rgba(16,10,8,0.94))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-7">
            <div className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[rgba(255,244,230,0.56)]">
              Welcome back
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] p-1">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={cn(
                  'flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition',
                  mode === 'signin'
                    ? 'bg-[linear-gradient(90deg,#ffb45e_0%,#ff9330_50%,#ff7a1a_100%)] text-white shadow-[0_10px_20px_rgba(249,115,22,0.22)]'
                    : 'text-[rgba(255,244,230,0.64)] hover:text-white'
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={cn(
                  'flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition',
                  mode === 'signup'
                    ? 'bg-[linear-gradient(90deg,#ffb45e_0%,#ff9330_50%,#ff7a1a_100%)] text-white shadow-[0_10px_20px_rgba(249,115,22,0.22)]'
                    : 'text-[rgba(255,244,230,0.64)] hover:text-white'
                )}
              >
                Create Account
              </button>
            </div>

            <div className="mt-6">
              <h2
                className="text-[2rem] leading-[1.02] tracking-[-0.045em] text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {mode === 'signin'
                  ? 'Continue gently from where you left off'
                  : 'Create a softer place for your pet life'}
              </h2>

              <p className="mt-3 text-[15px] leading-7 text-[rgba(255,244,230,0.70)]">
                {mode === 'signin'
                  ? 'Use Google or email to continue. If your account was first created with Google, continue with Google or set a password first.'
                  : 'Create your account with email first, then move naturally into pet setup, memories, and chat.'}
              </p>
            </div>

            {bannerText ? (
              <div
                className={cn(
                  'mt-5 rounded-[20px] border px-4 py-3 text-sm leading-7',
                  bannerTone === 'error' && 'border-red-300/18 bg-red-500/10 text-red-100',
                  bannerTone === 'success' && 'border-emerald-300/18 bg-emerald-500/10 text-emerald-100',
                  bannerTone === 'neutral' && 'border-amber-300/14 bg-amber-300/8 text-[rgba(255,244,230,0.84)]'
                )}
              >
                {bannerText}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || !supabase}
              className="mt-5 inline-flex h-[54px] w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-white transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
                <path d="M21.805 10.023h-9.72v3.955h5.568c-.24 1.27-.96 2.347-2.04 3.066v2.543h3.3c1.932-1.78 3.048-4.4 3.048-7.52 0-.69-.06-1.36-.156-2.044Z" fill="#4285F4" />
                <path d="M12.085 22c2.754 0 5.064-.912 6.756-2.473l-3.3-2.543c-.912.612-2.076.972-3.456.972-2.658 0-4.914-1.794-5.718-4.206H3.001v2.622A10.196 10.196 0 0 0 12.085 22Z" fill="#34A853" />
                <path d="M6.367 13.75a6.11 6.11 0 0 1-.318-1.95c0-.678.114-1.338.318-1.95V7.228H3.001A10.196 10.196 0 0 0 1.885 11.8c0 1.644.396 3.198 1.116 4.572l3.366-2.622Z" fill="#FBBC05" />
                <path d="M12.085 5.644c1.5 0 2.85.516 3.912 1.53l2.928-2.928C17.143 2.592 14.833 1.6 12.085 1.6A10.196 10.196 0 0 0 3.001 7.228L6.367 9.85c.804-2.412 3.06-4.206 5.718-4.206Z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[rgba(255,244,230,0.42)]">
                or continue with email
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.16em] text-[rgba(255,244,230,0.58)]">
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="h-[54px] w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-[15px] text-[#fff7ed] outline-none transition placeholder:text-[rgba(255,244,230,0.34)] focus:border-amber-300/28 focus:bg-white/[0.065]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.16em] text-[rgba(255,244,230,0.58)]">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'signin' ? 'Enter your password' : 'Create a secure password'}
                  className="h-[54px] w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-[15px] text-[#fff7ed] outline-none transition placeholder:text-[rgba(255,244,230,0.34)] focus:border-amber-300/28 focus:bg-white/[0.065]"
                />
              </div>

              {mode === 'signup' ? (
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.16em] text-[rgba(255,244,230,0.58)]">
                    Nickname
                  </label>
                  <input
                    type="text"
                    autoComplete="nickname"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="What should your pet call you"
                    className="h-[54px] w-full rounded-[18px] border border-white/10 bg-white/[0.05] px-4 text-[15px] text-[#fff7ed] outline-none transition placeholder:text-[rgba(255,244,230,0.34)] focus:border-amber-300/28 focus:bg-white/[0.065]"
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={loading || !supabase}
                  className="inline-flex h-[54px] min-w-[180px] items-center justify-center rounded-full bg-[linear-gradient(90deg,#ffb45e_0%,#ff9330_50%,#ff7a1a_100%)] px-6 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(249,115,22,0.25)] transition hover:-translate-y-[1px] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading
                    ? mode === 'signin'
                      ? 'Signing in...'
                      : 'Creating...'
                    : mode === 'signin'
                    ? 'Sign In'
                    : 'Create Account'}
                </button>

                {mode === 'signin' ? (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={resetting || loading || !supabase}
                    className="text-sm font-semibold text-[rgba(255,244,230,0.62)] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {resetting ? 'Sending reset link...' : 'Forgot password?'}
                  </button>
                ) : (
                  <div className="text-sm text-[rgba(255,244,230,0.54)]">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="font-semibold text-white transition hover:text-[#ffd39b]"
                    >
                      Sign in
                    </button>
                  </div>
                )}
              </div>
            </form>

            <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-[rgba(255,244,230,0.68)]">
              If your first login was through Google, continue with Google first. If you later want to sign in with email, set or reset a password after entering your account.
            </div>

            {!supabase ? (
              <div className="mt-4 rounded-[20px] border border-red-300/18 bg-red-500/10 px-4 py-3 text-sm leading-7 text-red-100">
                Supabase client environment is missing. Please verify <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
              </div>
            ) : null}

            <div className="mt-5 text-xs leading-6 text-[rgba(255,244,230,0.42)]">
              After successful sign-in, you will return to{' '}
              <span className="font-bold text-[rgba(255,244,230,0.72)]">{nextHref}</span>.
            </div>

            <div className="mt-4 text-sm text-[rgba(255,244,230,0.54)]">
              Want to go back first?{' '}
              <Link href="/" className="font-semibold text-white transition hover:text-[#ffd39b]">
                Return Home
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}
