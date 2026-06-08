'use client';

import { useMemo, useState } from 'react';
import {
  sendPasswordSetupLink,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from '@/app/actions/auth';

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

function fieldClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-stone-500 outline-none transition focus:border-amber-300/35 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/10';
}

export function LoginFormClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const trimmedEmail = useMemo(() => email.trim(), [email]);

  return (
    <div className='mt-6 grid gap-4'>
      <form action={signInWithGoogle}>
        <button
          type='submit'
          className='flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition hover:bg-white/[0.08]'
        >
          <GoogleLogo />
          <span>Continue with Google</span>
        </button>
      </form>

      <div className='rounded-2xl border border-amber-300/12 bg-amber-300/8 px-4 py-3 text-center text-sm leading-7 text-stone-200'>
        If you first created this account with Google, continue with Google.
        If you want to use email sign-in later, set a password first.
      </div>

      <div className='my-1 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-stone-500 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10'>
        Or continue with email
      </div>

      <form action={signInWithPassword} className='grid gap-4'>
        <label className='grid gap-2 text-sm font-bold text-stone-100'>
          Email address
          <input
            className={fieldClassName()}
            name='email'
            type='email'
            placeholder='name@example.com'
            autoComplete='email'
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className='grid gap-2 text-sm font-bold text-stone-100'>
          Password
          <div className='relative'>
            <input
              className={`${fieldClassName()} pr-12`}
              name='password'
              type={passwordVisible ? 'text' : 'password'}
              placeholder='Enter your password'
              autoComplete='current-password'
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
          Nickname (optional)
          <input
            className={fieldClassName()}
            name='nickname'
            type='text'
            placeholder='What should your pet call you'
            autoComplete='nickname'
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </label>

        <div className='rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div className='text-sm leading-7 text-stone-300'>
              Forgot password or want to enable email sign-in for a Google-first
              account?
            </div>

            <button
              type='submit'
              formAction={sendPasswordSetupLink}
              formNoValidate
              className='shrink-0 rounded-full border border-amber-300/18 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-300/14'
            >
              Forgot password / Set password
            </button>
          </div>

          <p className='mt-2 text-xs leading-6 text-stone-500'>
            Enter your email above, then click this button. We will send a secure
            email link for password setup or reset.
          </p>
        </div>

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

      {trimmedEmail ? (
        <div className='rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-6 text-stone-400'>
          Current email for password setup/reset: <span className='font-semibold text-stone-200'>{trimmedEmail}</span>
        </div>
      ) : null}
    </div>
  );
}

export default LoginFormClient;
