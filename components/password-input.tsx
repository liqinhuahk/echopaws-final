'use client';

import { useState } from 'react';

type PasswordInputProps = {
  name: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

export function PasswordInput({
  name,
  placeholder = 'Enter your password',
  autoComplete = 'current-password',
  required = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className='relative'>
      <input
        className='input-shell pr-16'
        name={name}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />

      <button
        type='button'
        onClick={() => setVisible((v) => !v)}
        className='absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800'
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? '隐藏' : '显示'}
      </button>
    </div>
  );
}

