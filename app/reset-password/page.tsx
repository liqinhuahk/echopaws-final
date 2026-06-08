'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted && data.session) {
          setReady(true);
        }
      } catch {
        // ignore
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          mounted &&
          (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') &&
          session
        ) {
          setReady(true);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    const cleanup = init();

    return () => {
      mounted = false;
      Promise.resolve(cleanup).then((fn) => fn && fn());
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

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
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message || 'Could not update password.');
        return;
      }

      setMessage('Password updated successfully. You can now sign in with email and password.');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Could not update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen overflow-hidden bg-[#060504] text-[#f7efe5]'>
      <div className='pointer-events-none fixed inset-0'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,158,11,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_22%),linear-gradient(180deg,#0b0908_0%,#060504_48%,#050404_100%)]' />
      </div>

      <main className='container-shell relative z-10 py-16'>
        <div className='mx-auto max-w-xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,17,13,0.92),rgba(11,9,8,0.92))] p-7 shadow-[0_24px_56px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-8'>
          <div className='text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-orange-300'>
            Password Setup
          </div>

          <h1 className='mt-4 text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.05em] text-white'>
            Set your password
          </h1>

          <p className='mt-3 text-sm leading-7 text-stone-300'>
            This lets you use email + password sign-in later. If your account was first
            created with Google, this step enables password login for the same account.
          </p>

          {!ready ? (
            <div className='mt-6 rounded-2xl border border-amber-300/12 bg-amber-300/8 px-4 py-3 text-sm text-amber-100'>
              Open this page from the password email link we sent you. Once the recovery
              session is detected, you can set your new password here.
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
              <input
                className='w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-stone-500 outline-none transition focus:border-amber-300/35 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10'
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder='At least 6 characters'
                minLength={6}
                required
              />
            </label>

            <label className='grid gap-2 text-sm font-bold text-stone-100'>
              Confirm password
              <input
                className='w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-stone-500 outline-none transition focus:border-amber-300/35 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10'
                type='password'
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder='Re-enter password'
                minLength={6}
                required
              />
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
            <Link href='/login' className='text-sm font-bold text-amber-200 underline underline-offset-4'>
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
