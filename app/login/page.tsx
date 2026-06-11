'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SiteHeader from '@/components/site-header';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const AUTH_CALLBACK_PATH = '/auth/callback';

type Mode = 'signin' | 'signup';

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a3 3 0 0 0 4 4" />
      <path d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.1 4.2" />
      <path d="M6.6 6.7C4.1 8.4 2.5 12 2.5 12S6.1 19 12 19c1.7 0 3.3-.4 4.7-1.1" />
    </svg>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0b0706] text-[#f7efe8]">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10 md:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
            <div className="space-y-3">
              <div className="h-14 w-full max-w-[520px] animate-pulse rounded-2xl bg-white/10" />
              <div className="h-14 w-full max-w-[420px] animate-pulse rounded-2xl bg-white/10" />
            </div>
            <div className="h-24 w-full max-w-[560px] animate-pulse rounded-3xl bg-white/5" />
          </div>

          <div className="rounded-[30px] border border-white/15 bg-[rgba(20,10,8,0.78)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="h-11 w-full animate-pulse rounded-full bg-white/10" />
            <div className="mt-6 h-12 w-full animate-pulse rounded-2xl bg-white/10" />
            <div className="mt-6 space-y-4">
              <div className="h-14 w-full animate-pulse rounded-2xl bg-white/10" />
              <div className="h-14 w-full animate-pulse rounded-2xl bg-white/10" />
              <div className="h-12 w-full animate-pulse rounded-full bg-white/10" />
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

  const next = useMemo(() => {
    const raw = searchParams.get('next');
    if (!raw || !raw.startsWith('/')) return '/chat';
    return raw;
  }, [searchParams]);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }, []);

  const callbackUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(next)}`;
  }, [next]);

  const resetFeedback = () => {
    setError(null);
    setMessage(null);
  };

  const handleGoogleAuth = async () => {
    resetFeedback();

    if (!supabase) {
      setError('Supabase 环境变量未配置，暂时无法使用 Google 登录。');
      return;
    }

    try {
      setGoogleLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setError(error.message || 'Google 登录启动失败，请稍后再试。');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google 登录失败，请稍后再试。');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetFeedback();

    if (!supabase) {
      setError('Supabase 环境变量未配置，暂时无法使用邮箱登录。');
      return;
    }

    if (!email.trim()) {
      setError('请输入邮箱地址。');
      return;
    }

    if (!password.trim()) {
      setError('请输入密码。');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('请输入你的称呼。');
        return;
      }

      if (password.length < 6) {
        setError('密码长度至少 6 位。');
        return;
      }

      if (password !== confirmPassword) {
        setError('两次输入的密码不一致。');
        return;
      }
    }

    try {
      setLoading(true);

      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setError(error.message || '登录失败，请检查邮箱和密码。');
          return;
        }

        router.push(next);
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setError(error.message || '创建账户失败，请稍后再试。');
        return;
      }

      setMessage('账户已创建。请检查邮箱中的验证邮件，验证后再继续登录。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    resetFeedback();

    if (!supabase) {
      setError('Supabase 环境变量未配置，暂时无法重设密码。');
      return;
    }

    if (!email.trim()) {
      setError('请先输入邮箱地址，再点击忘记密码。');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: callbackUrl,
      });

      if (error) {
        setError(error.message || '重设密码邮件发送失败。');
        return;
      }

      setMessage('重设密码邮件已发送，请前往邮箱查收。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '重设密码失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#0b0706] text-[#f7efe8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,140,64,0.18),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(255,120,40,0.12),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(255,120,40,0.1),transparent_35%)]" />
      <SiteHeader />

      <main className="relative mx-auto max-w-7xl px-6 pb-16 pt-8 md:px-8 lg:px-10 lg:pt-10">
        <div className="grid items-start gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12">
          <section className="pt-6 lg:pt-16">
            <div className="inline-flex items-center rounded-full border border-[rgba(255,210,180,0.24)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f0c7a6]">
              Softer sign-in experience
            </div>

            <h1 className="mt-6 max-w-[620px] text-balance text-[54px] font-semibold leading-[0.92] tracking-[-0.04em] text-[#fff7f2] md:text-[72px]">
              Return to your{' '}
              <span className="bg-gradient-to-r from-[#ffd4aa] via-[#ffb067] to-[#ff9340] bg-clip-text text-transparent">
                companion
              </span>{' '}
              world
            </h1>

            <p className="mt-6 max-w-[600px] text-[15px] leading-8 text-[rgba(255,240,232,0.72)] md:text-[16px]">
              A warmer, calmer entry point that feels like a natural continuation of Home —
              less like a campaign page, more like a comfortable place to sign in and continue
              your relationship with your pet.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-[26px] border border-white/14 bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <p className="text-sm font-semibold text-[#fff4ec]">Calmer visual rhythm</p>
                <p className="mt-2 text-sm leading-7 text-[rgba(255,239,230,0.68)]">
                  Reduced headline pressure, softer contrast, and more breathing room so the
                  page feels reassuring rather than loud.
                </p>
              </div>

              <div className="rounded-[26px] border border-white/14 bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <p className="text-sm font-semibold text-[#fff4ec]">Better form readability</p>
                <p className="mt-2 text-sm leading-7 text-[rgba(255,239,230,0.68)]">
                  Dark glass inputs, clearer labels, and more consistent spacing for easier
                  typing and lower visual fatigue.
                </p>
              </div>

              <div className="rounded-[26px] border border-white/14 bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm md:col-span-2">
                <p className="text-sm leading-7 text-[rgba(255,239,230,0.68)]">
                  Sign in first, then continue with Chat, Memories, Account, and your pet setup
                  in one unified visual flow.
                </p>
              </div>
            </div>
          </section>

          <section className="relative">
            <div className="rounded-[30px] border border-[rgba(255,233,220,0.16)] bg-[linear-gradient(180deg,rgba(29,14,11,0.82),rgba(17,8,7,0.9))] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-6">
              <div className="inline-flex items-center rounded-full border border-[rgba(255,210,180,0.22)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f0c7a6]">
                Welcome back
              </div>

              <div className="mt-5 rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] p-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      resetFeedback();
                      setMode('signin');
                    }}
                    className={[
                      'rounded-full px-4 py-3 text-sm font-semibold transition',
                      mode === 'signin'
                        ? 'bg-gradient-to-r from-[#ffbf7a] to-[#ff8f2b] text-[#2c140b] shadow-[0_10px_25px_rgba(255,145,51,0.35)]'
                        : 'text-[rgba(255,240,232,0.7)] hover:bg-white/5',
                    ].join(' ')}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetFeedback();
                      setMode('signup');
                    }}
                    className={[
                      'rounded-full px-4 py-3 text-sm font-semibold transition',
                      mode === 'signup'
                        ? 'bg-gradient-to-r from-[#ffbf7a] to-[#ff8f2b] text-[#2c140b] shadow-[0_10px_25px_rgba(255,145,51,0.35)]'
                        : 'text-[rgba(255,240,232,0.7)] hover:bg-white/5',
                    ].join(' ')}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.03em] text-[#fff6f0] md:text-[26px]">
                  {mode === 'signin'
                    ? 'Continue gently from where you left off'
                    : 'Create your EchoPaws companion account'}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[rgba(255,237,228,0.68)]">
                  {mode === 'signin'
                    ? 'Use Google or email to continue. If your account was first created with Google, continue with Google or set a password first.'
                    : 'Use Google for the quickest start, or create an account with email and password.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
                className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-4 text-sm font-semibold text-[#fff2ea] transition hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M21.8 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.05-4.4 3.05-7.63Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 22c2.76 0 5.07-.91 6.76-2.47l-3.3-2.56c-.91.61-2.08.98-3.46.98-2.66 0-4.91-1.8-5.72-4.22H2.87v2.65A10 10 0 0 0 12 22Z"
                    fill="#34A853"
                  />
                  <path
                    d="M6.28 13.73A5.98 5.98 0 0 1 6 12c0-.6.1-1.18.28-1.73V7.62H2.87A10 10 0 0 0 2 12c0 1.61.38 3.13 1.05 4.38l3.23-2.65Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 6.05c1.5 0 2.86.52 3.93 1.54l2.95-2.95C17.06 2.91 14.75 2 12 2A10 10 0 0 0 2.87 7.62l3.41 2.65c.81-2.42 3.06-4.22 5.72-4.22Z"
                    fill="#EA4335"
                  />
                </svg>
                {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgba(255,225,208,0.38)]">
                  Or continue with email
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === 'signup' && (
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,220,198,0.56)]">
                      Your name
                    </span>
                    <input
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="How should your pet call you?"
                      className="h-14 w-full rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(240,240,255,0.92)] px-4 text-[15px] text-[#1e1612] outline-none transition placeholder:text-[rgba(62,44,34,0.45)] focus:border-[#ffb067] focus:bg-white focus:ring-4 focus:ring-[rgba(255,161,79,0.16)]"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,220,198,0.56)]">
                    Email address
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-14 w-full rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(240,240,255,0.92)] px-4 text-[15px] text-[#1e1612] outline-none transition placeholder:text-[rgba(62,44,34,0.45)] focus:border-[#ffb067] focus:bg-white focus:ring-4 focus:ring-[rgba(255,161,79,0.16)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,220,198,0.56)]">
                    Password
                  </span>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
                      className="h-14 w-full rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(240,240,255,0.92)] pl-4 pr-14 text-[15px] text-[#1e1612] outline-none transition placeholder:text-[rgba(62,44,34,0.45)] focus:border-[#ffb067] focus:bg-white focus:ring-4 focus:ring-[rgba(255,161,79,0.16)]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? '隐藏密码' : '显示密码'}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-2xl text-[#6f5548] transition hover:text-[#2b1911] focus:outline-none"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </label>

                {mode === 'signup' && (
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,220,198,0.56)]">
                      Confirm password
                    </span>

                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="h-14 w-full rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(240,240,255,0.92)] pl-4 pr-14 text-[15px] text-[#1e1612] outline-none transition placeholder:text-[rgba(62,44,34,0.45)] focus:border-[#ffb067] focus:bg-white focus:ring-4 focus:ring-[rgba(255,161,79,0.16)]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? '隐藏确认密码' : '显示确认密码'}
                        aria-pressed={showConfirmPassword}
                        className="absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-2xl text-[#6f5548] transition hover:text-[#2b1911] focus:outline-none"
                      >
                        <EyeIcon open={showConfirmPassword} />
                      </button>
                    </div>
                  </label>
                )}

                {error ? (
                  <div className="rounded-2xl border border-[rgba(255,120,120,0.22)] bg-[rgba(120,20,20,0.18)] px-4 py-3 text-sm leading-7 text-[#ffd7d7]">
                    {error}
                  </div>
                ) : null}

                {message ? (
                  <div className="rounded-2xl border border-[rgba(255,180,105,0.22)] bg-[rgba(255,149,61,0.12)] px-4 py-3 text-sm leading-7 text-[#ffe2c5]">
                    {message}
                  </div>
                ) : null}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="inline-flex h-12 min-w-[140px] items-center justify-center rounded-full bg-gradient-to-r from-[#ffc280] to-[#ff922d] px-6 text-sm font-semibold text-[#2c140b] shadow-[0_14px_35px_rgba(255,145,51,0.34)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_42px_rgba(255,145,51,0.42)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? mode === 'signin'
                        ? 'Signing in…'
                        : 'Creating…'
                      : mode === 'signin'
                        ? 'Sign In'
                        : 'Create Account'}
                  </button>

                  {mode === 'signin' ? (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading || googleLoading}
                      className="text-sm font-medium text-[rgba(255,231,217,0.74)] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="mt-6 rounded-[24px] border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-7 text-[rgba(255,237,228,0.62)]">
                If your first login was through Google, continue with Google first. If you later
                want to sign in with email, set or reset a password after entering your account.
              </div>

              <div className="mt-6 text-xs leading-7 text-[rgba(255,225,208,0.42)]">
                After successful sign-in, you will return to <span className="text-[#ffd7b0]">{next}</span>.
              </div>

              <div className="mt-2 text-sm text-[rgba(255,237,228,0.66)]">
                Want to go back first?{' '}
                <Link href="/" className="font-semibold text-[#ffd2a4] transition hover:text-white">
                  Return Home
                </Link>
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
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}
