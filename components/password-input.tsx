'use client';

import { useState, type InputHTMLAttributes } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({
  className = '',
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className='relative'>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`input-shell pr-12 ${className}`.trim()}
      />

      <button
        type='button'
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className='absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition hover:bg-white/8 hover:text-stone-100'
      >
        {visible ? (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.8'
            className='h-5 w-5'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M3 3l18 18'
            />
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
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M2.46 12.04C3.73 9.96 7.05 5.8 12 5.8s8.27 4.16 9.54 6.24a1 1 0 010 1.02C20.27 15.14 16.95 19.3 12 19.3s-8.27-4.16-9.54-6.24a1 1 0 010-1.02z'
            />
            <circle cx='12' cy='12.55' r='3.2' />
          </svg>
        )}
      </button>
    </div>
  );
}
