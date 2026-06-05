'use client';

import { useRef, useState } from 'react';

type EnglishFileUploadProps = {
  name: string;
  accept?: string;
};

export function EnglishFileUpload({
  name,
  accept = 'image/png,image/jpeg,image/webp',
}: EnglishFileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('No file selected');

  return (
    <div className='mt-4 flex flex-col items-center gap-3'>
      <input
        ref={inputRef}
        name={name}
        type='file'
        accept={accept}
        className='hidden'
        onChange={(event) => {
          const file = event.target.files?.[0];
          setFileName(file ? file.name : 'No file selected');
        }}
      />

      <button
        type='button'
        onClick={() => inputRef.current?.click()}
        className='inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50'
      >
        Choose File
      </button>

      <div className='text-sm text-slate-600'>{fileName}</div>
    </div>
  );
}
