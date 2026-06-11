'use client';

import Link from 'next/link';
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SiteHeader from '@/components/site-header';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const AUTH_CALLBACK_PATH = '/auth/callback';

type AuthMode = 'signin' | 'signup';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2.25 12s3.75-7 9.75-7 9.75 7 9.75 7-3.75 7-9.75 7-9.75-7-9.75-7Z" />
        <circle cx="12" cy="12" r="3.25" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A3 3 0 0 0 13.42 13.42" />
      <path d="M9.88 5.08A10.94 10.94 0 0 1 12 4.88c6 0 9.75 7.12 9.75 7.12a16.3 16.3 0 0 1-3.03 3.94" />
      <path d="M6.66 6.67C4.42 8.23 2.99 10.78 2.25 12c0 0 3.75 7 9.75 7 1.76 0 3.35-.43 4.77-1.16" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="3" />
      <path d="M8 10V7.75A4 4 0 0 1 12 4a4 4 0 0 1 4 3.75V10" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.85 5.15L19 9l-5.15 1.85L12 16l-1.85-5.15L5 9l5.15-1.85L12 2Z" />
      <path d="M18.5 15l.92 2.58L22 18.5l-2.58.92L18.5 22l-.92-2.58L15 18.5l2.58-.92L18.5 15Z" />
      <path d="M5.5 14l.76 2.24L8.5 17l-2.24.76L5.5 20l-.76-2.24L2.5 17l2.24-.76L5.5 14Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
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
  );
}

function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-[#0b0706] text-[#f8efe8]">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-24 md:px-8 md:pt-28 xl:px-10 xl:pt-32">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] xl:gap-10">
          <div className="space-y-5">
            <div className="h-8 w-44 animate-pulse rounded-full bg-white/10" />
            <div className="h-20 max-w-[540px] animate-pulse rounded-[32px] bg-white/10" />
            <div className="h-24 max-w-[600px] animate-pulse rounded-[28px] bg-white/5" />
          </div>

          <div className="mx-auto mt-2 w-full max-w-[520px] rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:mt-4 xl:mt-0">
            <div className="h-11 w-full animate-pulse rounded-full bg-white/10" />
            <div className="mt-6 h-14 w-full animate-pulse rounded-2xl bg-white/10" />
            <div className="mt-6 space-y-4">
              <div className="h-14 w-full animate-pulse rounded-[20px] bg-white/10" />
              <div className="h-14 w-full animate-pulse rounded-[20px] bg-white/10" />
              <div className="h-12 w-full animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputField({
  label,
  type,
  autoComplete,
  value,
  onChange,
  placeholder,
  icon,
  rightSlot,
  onKeyUp,
  onKeyDown,
}: {
  label: string;
  type: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ReactNode;
  rightSlot?: ReactNode;
  onKeyUp?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,224,206,0.54)]">
        {label}
      </span>

      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-[rgba(84,56,44,0.68)]">
          {icon}
        </div>

        <input
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={onKeyUp}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            'h-14 w-full rounded-[20px] border border-[rgba(255,222,204,0.12)]',
            'bg-[linear-gradient(180deg,rgba(255,252,250,0.96),rgba(249,244,239,0.96))]',
            'pl-12 pr-4 text-[15px] text-[#1d1511] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
            'outline-none transition duration-200',
            'placeholder:text-[rgba(70,49,38,0.42)]',
            'focus:border-[#ffae69] focus:bg-white focus:ring-4 focus:ring-[rgba(255,164,84,0.14)]',
            'group-hover:border-[rgba(255,190,142,0.18)]',
            rightSlot ? 'pr-14' : ''
          )}
        />

        {rightSlot ? (
          <div className="absolute inset-y-0 right-0 flex items-center justify-center">
            {rightSlot}
          </div>
        ) : null}
      </div>
    </label>
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

  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }, []);

  const passwordStrength = useMemo(() => {
    const value = password.trim();
    if (!value) return { score: 0, label: 'Not entered', color: 'bg-white/10' };

    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-[#ff8f7a]' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-[#ffbf73]' };
    if (score === 3) return { score, label: 'Good', color: 'bg-[#ffc96d]' };
    return { score, label: 'Strong', color: 'bg-[#71d49b]' };
  }, [password]);

  useEffect(() => {
    setError(null);
    setMessage(null);
  }, [mode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedEmail = window.localStorage.getItem('echopaws_last_email');
    if (savedEmail && !email) {
      setEmail(savedEmail);
    }
  }, [email]);

  function getCallbackUrl() {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(next)}`;
  }

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  function normalizeError(input: unknown) {
    const raw =
      typeof input === 'string'
        ? input
        : input instanceof Error
          ? input.message
          : 'Something went wrong. Please try again.';

    const msg = raw.toLowerCase();

    if (msg.includes('invalid login credentials')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Your email address has not been verified yet. Please check your inbox.';
    }
    if (msg.includes('user already registered')) {
      return 'This email is already registered. Please sign in instead.';
    }
    if (msg.includes('password should be at least')) {
      return 'Your password is too short. Please use at least 6 characters.';
    }
    if (msg.includes('network')) {
      return 'A network issue was detected. Please try again in a moment.';
    }

    return raw || 'Something went wrong. Please try again.';
  }

  async function handleGoogleLogin() {
    clearFeedback();

    if (!supabase) {
      setError('Supabase environment variables are not configured.');
      return;
    }

    try {
      setGoogleLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getCallbackUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setError(normalizeError(error));
      }
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword() {
    clearFeedback();

    if (!supabase) {
      setError('Supabase environment variables are not configured.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address first.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getCallbackUrl(),
      });

      if (error) {
        setError(normalizeError(error));
        return;
      }

      setMessage('A password reset email has been sent to your inbox.');
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!supabase) {
      setError('Supabase environment variables are not configured.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your name.');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setError('The two passwords do not match.');
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
          setError(normalizeError(error));
          return;
        }

        if (rememberMe && typeof window !== 'undefined') {
          window.localStorage.setItem('echopaws_last_email', email.trim());
        }

        router.push(next);
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getCallbackUrl(),
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setError(normalizeError(error));
        return;
      }

      setMessage('Your account has been created. Please verify your email before signing in.');
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0706] text-[#f8efe8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(255,148,67,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(255,175,96,0.10),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(255,120,64,0.08),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />

      <SiteHeader />

      <main className="relative mx-auto max-w-7xl px-6 pb-16 pt-24 md:px-8 md:pt-28 xl:px-10 xl:pt-32">
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] xl:gap-10">
          <section className="pt-2 xl:pt-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,214,182,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#efc39e] backdrop-blur-sm">
              <SparkIcon />
              Warm Luxury Login
            </div>

            <h1 className="mt-6 max-w-[720px] text-balance text-[44px] font-semibold leading-[0.94] tracking-[-0.05em] text-[#fff8f2] md:text-[58px] xl:text-[74px]">
              Sign in with calm,
              <br />
              continue with{' '}
              <span className="bg-gradient-to-r from-[#ffd8b3] via-[#ffbe77] to-[#ff9440] bg-clip-text text-transparent">
                comfort
              </span>
            </h1>

            <p className="mt-6 max-w-[620px] text-[15px] leading-8 text-[rgba(255,239,231,0.72)] md:text-[16px]">
              A refined sign-in experience that stays aligned with the EchoPaws home theme:
              warm, elegant, readable, and reassuring for everyday use.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-[rgba(255,230,214,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e9bb96]">
                  Better readability
                </div>
                <p className="mt-3 text-sm leading-7 text-[rgba(255,238,229,0.68)]">
                  Clearer hierarchy, softer contrast, and easier reading across the whole page.
                </p>
              </div>

              <div className="rounded-[28px] border border-[rgba(255,230,214,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e9bb96]">
                  Gentler form feel
                </div>
                <p className="mt-3 text-sm leading-7 text-[rgba(255,238,229,0.68)]">
                  Softer surfaces, calmer spacing, and more comfortable inputs for daily use.
                </p>
              </div>

              <div className="rounded-[28px] border border-[rgba(255,230,214,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e9bb96]">
                  Safer interaction
                </div>
                <p className="mt-3 text-sm leading-7 text-[rgba(255,238,229,0.68)]">
                  Password visibility toggle, Caps Lock notice, and clearer feedback states.
                </p>
              </div>
            </div>

            <div className="mt-8 max-w-[640px] rounded-[30px] border border-[rgba(255,228,212,0.12)] bg-[linear-gradient(180deg,rgba(26,14,11,0.76),rgba(15,8,7,0.86))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#eabf9a]">
                    EchoPaws feeling
                  </div>
                  <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-[#fff5ee]">
                    Less noise, more trust
                  </h2>
                </div>

                <div className="rounded-full border border-[rgba(255,221,202,0.14)] bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[rgba(255,235,223,0.66)]">
                  Home-aligned
                </div>
              </div>

              <p className="mt-4 text-sm leading-8 text-[rgba(255,239,231,0.68)]">
                This page is designed to feel like part of the product, not just a utility screen —
                calm to enter, clear to use, and consistent with the rest of the EchoPaws experience.
              </p>
            </div>
          </section>

          <section className="self-start">
            <div className="relative mx-auto mt-2 w-full max-w-[520px] md:mt-4 xl:mt-0">
              <div className="absolute -inset-3 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(255,165,88,0.16),transparent_38%)] blur-2xl" />
              <div className="relative rounded-[32px] border border-[rgba(255,233,220,0.14)] bg-[linear-gradient(180deg,rgba(32,17,13,0.82),rgba(16,9,8,0.94))] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl md:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,214,182,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#efc39e]">
                    Auth
                  </div>

                  <div className="rounded-full border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] text-[rgba(255,234,224,0.6)]">
                    Redirect → <span className="text-[#ffd4a8]">{next}</span>
                  </div>
                </div>

                <div className="rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] p-1">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className={cn(
                        'rounded-full px-4 py-3 text-sm font-semibold transition',
                        mode === 'signin'
                          ? 'bg-gradient-to-r from-[#ffc887] to-[#ff9430] text-[#2f160c] shadow-[0_12px_30px_rgba(255,151,57,0.36)]'
                          : 'text-[rgba(255,238,229,0.7)] hover:bg-white/5'
                      )}
                    >
                      Sign In
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className={cn(
                        'rounded-full px-4 py-3 text-sm font-semibold transition',
                        mode === 'signup'
                          ? 'bg-gradient-to-r from-[#ffc887] to-[#ff9430] text-[#2f160c] shadow-[0_12px_30px_rgba(255,151,57,0.36)]'
                          : 'text-[rgba(255,238,229,0.7)] hover:bg-white/5'
                      )}
                    >
                      Create Account
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-[#fff6f0]">
                    {mode === 'signin'
                      ? 'Welcome back to your companion space'
                      : 'Create your EchoPaws account'}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-[rgba(255,238,229,0.66)]">
                    {mode === 'signin'
                      ? 'Continue with Google or sign in with email and password.'
                      : 'Create an account to continue with Chat, Memories, and the rest of your EchoPaws experience.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-[20px] border border-[rgba(255,233,220,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.035))] px-4 text-sm font-semibold text-[#fff4ed] transition hover:border-[rgba(255,214,182,0.18)] hover:bg-[rgba(255,255,255,0.07)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <GoogleIcon />
                  {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
                </button>

                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgba(255,224,206,0.38)]">
                    Or use email
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' ? (
                    <InputField
                      label="Your name"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={setFullName}
                      placeholder="How should your pet call you?"
                      icon={<UserIcon />}
                    />
                  ) : null}

                  <InputField
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    icon={<MailIcon />}
                  />

                  <InputField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={setPassword}
                    placeholder={mode === 'signin' ? 'Enter your password' : 'Create a secure password'}
                    icon={<LockIcon />}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                    onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="mr-1 flex h-12 w-12 items-center justify-center rounded-full text-[#6c5244] transition hover:bg-[rgba(77,47,33,0.08)] hover:text-[#2a1811] focus:outline-none"
                      >
                        <EyeIcon visible={showPassword} />
                      </button>
                    }
                  />

                  {capsLockOn ? (
                    <div className="rounded-2xl border border-[rgba(255,191,115,0.18)] bg-[rgba(255,173,92,0.10)] px-4 py-3 text-sm text-[#ffd9b3]">
                      Caps Lock is on. Please check your password carefully.
                    </div>
                  ) : null}

                  {mode === 'signup' ? (
                    <>
                      <InputField
                        label="Confirm password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Re-enter your password"
                        icon={<LockIcon />}
                        rightSlot={
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            aria-label={
                              showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                            }
                            aria-pressed={showConfirmPassword}
                            className="mr-1 flex h-12 w-12 items-center justify-center rounded-full text-[#6c5244] transition hover:bg-[rgba(77,47,33,0.08)] hover:text-[#2a1811] focus:outline-none"
                          >
                            <EyeIcon visible={showConfirmPassword} />
                          </button>
                        }
                      />

                      <div className="rounded-[22px] border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.03)] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-[rgba(255,240,232,0.78)]">
                            Password strength
                          </span>
                          <span className="text-sm font-semibold text-[#ffe0bf]">
                            {passwordStrength.label}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map((n) => (
                            <div
                              key={n}
                              className={cn(
                                'h-2 rounded-full',
                                passwordStrength.score >= n ? passwordStrength.color : 'bg-white/10'
                              )}
                            />
                          ))}
                        </div>

                        <p className="mt-3 text-xs leading-6 text-[rgba(255,235,223,0.54)]">
                          For better security, use 8+ characters with uppercase letters, numbers,
                          or symbols.
                        </p>
                      </div>
                    </>
                  ) : null}

                  <div className="flex items-center justify-between gap-4 rounded-[22px] border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-[rgba(255,241,233,0.72)]">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-transparent text-[#ff9c46] focus:ring-[#ff9c46]"
                      />
                      Remember my email
                    </label>

                    {mode === 'signin' ? (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading || googleLoading}
                        className="text-sm font-medium text-[#ffd2a7] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Forgot password
                      </button>
                    ) : (
                      <span className="text-xs text-[rgba(255,235,223,0.46)]">
                        Email verification required
                      </span>
                    )}
                  </div>

                  {error ? (
                    <div className="rounded-[22px] border border-[rgba(255,117,117,0.2)] bg-[rgba(121,24,24,0.18)] px-4 py-3 text-sm leading-7 text-[#ffd9d9]">
                      {error}
                    </div>
                  ) : null}

                  {message ? (
                    <div className="rounded-[22px] border border-[rgba(255,192,122,0.2)] bg-[rgba(255,164,84,0.12)] px-4 py-3 text-sm leading-7 text-[#ffe2bf]">
                      {message}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ffc887] via-[#ffab55] to-[#ff9430] px-6 text-sm font-semibold text-[#31180d] shadow-[0_16px_38px_rgba(255,145,51,0.34)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(255,145,51,0.42)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? mode === 'signin'
                        ? 'Signing in…'
                        : 'Creating account…'
                      : mode === 'signin'
                        ? 'Sign In'
                        : 'Create Account'}
                  </button>
                </form>

                <div className="mt-6 rounded-[24px] border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-7 text-[rgba(255,238,229,0.64)]">
                  If your account was originally created with Google, it is best to continue with
                  Google first. You can set or reset an email password later if needed.
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[rgba(255,236,226,0.56)]">
                  <span>
                    Need a softer landing first?{' '}
                    <Link href="/" className="font-semibold text-[#ffd1a3] transition hover:text-white">
                      Return Home
                    </Link>
                  </span>

                  <span>
                    After sign-in you will continue to{' '}
                    <span className="font-medium text-[#ffe1c0]">{next}</span>
                  </span>
                </div>
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
    <Suspense fallback={<AuthSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}
