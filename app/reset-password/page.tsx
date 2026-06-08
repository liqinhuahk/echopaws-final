'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

function normalizeAuthError(message: string, fallback: string) {
  const raw = (message || '').trim();
  if (!raw) return fallback;

  const lowered = raw.toLowerCase();

  if (
    lowered.includes('session') &&
    (lowered.includes('missing') || lowered.includes('not found'))
  ) {
    return 'Password recovery session was not found. Please open this page from the email link we sent you.';
  }

  if (lowered.includes('same password')) {
    return 'Your new password must be different from the old password.';
  }

  if (lowered.includes('password should be at least')) {
    return raw;
  }

  if (
    lowered.includes('jwt') ||
    lowered.includes('expired') ||
    lowered.includes('token')
  ) {
    return 'This password setup link is invalid or expired. Please request a new one from the login page.';
  }

  return raw;
}

function fieldClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-stone-500 outline-none transition focus:border-amber-300/35 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10';
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      className='h-5 w-5'
      aria-hidden='true'
    >
      <path strokeLinecap='round' strokeLinejoin='round' d='M3 3l18 18' />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9.88 5.09A9.77 9.77 0 0112 4.8c5.05 0 8.27 4.4 9 5.5a.9.9 0 010 .99 16.7 16.7 0 01-3.04 3.52'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M6.61 6.62A16.2 16.2 0 003 10.3a.9.9 0 000 .99c.9 1.35 4.1 5.51 9 5.51 1.53 0 2.92-.4 4.17-1.01'
      />
    </svg>
  ) : (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      className='h-5 w-5'
      aria-hidden='true'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M2.46 12.04C3.73 9.96 7.05 5.8 12 5.8s8.27 4.16 9.54 6.24a1 1 0 010 1.02C20.27 15.14 16.95 19.3 12 19.3s-8.27-4.16-9.54-6.24a1 1 0 010-1.02z'
      />
      <circle cx='12' cy='12.55' r='3.2' />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [ready, setReady] = useState(false);
  const [emailHint, setEmailHint] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function resolveRecoverySession() {
      setCheckingSession(true);
      setError(null);

      try {
        // 第一次尝试：直接检查 session
        let { data } = await supabase.auth.getSession();

        // 某些情况下浏览器需要一点时间处理 URL 中的 recovery token/hash
        if (!data.session && typeof window !== 'undefined') {
          const hasRecoveryHints =
            window.location.hash.includes('type=recovery') ||
            window.location.hash.includes('access_token=') ||
            window.location.search.includes('type=recovery') ||
            window.location.search.includes('code=');

          if (hasRecoveryHints) {
            for (let i = 0; i < 4; i += 1) {
              await new Promise((resolve) => setTimeout(resolve, 350));
              const retry = await supabase.auth.getSession();
              data = retry.data;
              if (data.session) break;
            }
          }
        }

        if (!mounted) return;

        if (data.session?.user) {
          setReady(true);
          setEmailHint(data.session.user.email ?? null);
        } else {
          setReady(false);
        }
      } catch (sessionError) {
        if (!mounted) return;
        setReady(false);
        setError(
          normalizeAuthError(
            sessionError instanceof Error ? sessionError.message : '',
            'Could not verify your password recovery session. Please use the link from your email again.',
          ),
        );
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    void resolveRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session?.user) {
        setReady(true);
        setCheckingSession(false);
        setEmailHint(session.user.email ?? null);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!ready) {
      setError('Please open this page from the password setup email link first.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(
          normalizeAuthError(
            updateError.message,
            'Could not update password. Please try again.',
          ),
        );
        return;
      }

      setMessage(
        'Password updated successfully. You can now sign in with email and password.',
      );
      setPassword('');
      setConfirmPassword('');
    } catch (updateError) {
      setError(
        normalizeAuthError(
          updateError instanceof Error ? updateError.message : '',
          'Could not update password. Please try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen overflow-hidden bg-[#060504] text-[#f7efe5]'>
      <div className='pointer-events-none fixed inset-0'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,158,11,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_22%),linear-gradient(180deg,#0b0908_0%,#060504_48%,#050404_100%)]' />
        <div className='absolute left-[-10%] top-[6%] h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-3xl' />
        <div className='absolute right-[-8%] top-[10%] h-[22rem] w-[22rem] rounded-full bg-amber-300/8 blur-3xl' />
      </div>

      <main className='container-shell relative z-10 py-16'>
        <div className='mx-auto max-w-xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,17,13,0.92),rgba(11,9,8,0.92))] p-7 shadow-[0_24px_56px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-8'>
          <div className='inline-flex items-center gap-2 rounded-full border border-amber-300/16 bg-amber-300/10 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-amber-200'>
            ✦ Password Setup
          </div>

          <h1 className='mt-4 text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.05em] text-white'>
            Set your password
          </h1>

          <p className='mt-3 text-sm leading-7 text-stone-300'>
            This enables email + password sign-in for future use. If this account was
            first created with Google, you can still keep Google login and add a
            password here for email sign-in later.
          </p>

          {emailHint ? (
            <div className='mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-200'>
              Account email: <span className='font-semibold text-white'>{emailHint}</span>
            </div>
          ) : null}

          {checkingSession ? (
            <div className='mt-6 rounded-2xl border border-amber-300/12 bg-amber-300/8 px-4 py-3 text-sm text-amber-100'>
              Checking your password recovery session...
            </div>
          ) : null}

          {!checkingSession && !ready ? (
            <div className='mt-6 rounded-2xl border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100'>
              This page must be opened from the password setup email link. If the link
              has expired, go back to login and request a new one.
            </div>
          ) : null}

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

          <form className='mt-6 grid gap-4' onSubmit={handleSubmit}>
            <label className='grid gap-2 text-sm font-bold text-stone-100'>
              New password
              <div className='relative'>
                <input
                  className={`${fieldClassName()} pr-12`}
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder='At least 6 characters'
                  minLength={6}
                  required
                />
                <button
                  type='button'
                  onClick={() => setPasswordVisible((v) => !v)}
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={passwordVisible}
                  className='absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition hover:bg-white/[0.06] hover:text-stone-200'
                >
                  <EyeIcon visible={passwordVisible} />
                </button>
              </div>
            </label>

            <label className='grid gap-2 text-sm font-bold text-stone-100'>
              Confirm password
              <div className='relative'>
                <input
                  className={`${fieldClassName()} pr-12`}
                  type={confirmVisible ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder='Re-enter password'
                  minLength={6}
                  required
                />
                <button
                  type='button'
                  onClick={() => setConfirmVisible((v) => !v)}
                  aria-label={confirmVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={confirmVisible}
                  className='absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition hover:bg-white/[0.06] hover:text-stone-200'
                >
                  <EyeIcon visible={confirmVisible} />
                </button>
              </div>
            </label>

            <button
              type='submit'
              disabled={!ready || loading}
              className='brand-button w-full disabled:cursor-not-allowed disabled:opacity-60'
            >
              {loading ? 'Updating password...' : 'Save password'}
            </button>
          </form>

          <div className='mt-5 text-center'>
            <Link
              href='/login'
              className='text-sm font-bold text-amber-200 underline underline-offset-4'
            >
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
