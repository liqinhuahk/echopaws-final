'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createPetAction } from '@/app/actions/pets';

function fieldClassName() {
  return [
    'w-full rounded-2xl border border-white/10 bg-[#16110e] px-4 py-3.5',
    'text-sm text-white placeholder:text-stone-500',
    'outline-none transition',
    'focus:border-amber-300/40 focus:bg-[#1b1511] focus:ring-4 focus:ring-amber-400/10',
  ].join(' ');
}

function submitButtonClassName() {
  return [
    'inline-flex min-h-12 items-center justify-center rounded-full px-5',
    'bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500',
    'text-sm font-extrabold text-stone-950 shadow-lg shadow-orange-900/20',
    'transition hover:brightness-105 active:scale-[0.99]',
    'disabled:cursor-not-allowed disabled:opacity-60',
  ].join(' ');
}

function secondaryButtonClassName() {
  return [
    'inline-flex min-h-12 items-center justify-center rounded-full px-5',
    'border border-white/12 bg-white/6 text-sm font-bold text-white',
    'transition hover:bg-white/10',
  ].join(' ');
}

function ChooseImageButton({
  onClick,
  hasFile,
}: {
  onClick: () => void;
  hasFile: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='inline-flex min-h-11 items-center justify-center rounded-full bg-amber-300 px-4 text-sm font-bold text-stone-950 transition hover:brightness-105'
    >
      {hasFile ? 'Replace Image' : 'Choose Image'}
    </button>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type='submit' className={submitButtonClassName()} disabled={pending}>
      {pending ? 'Creating Pet...' : 'Create Pet and Open Chat'}
    </button>
  );
}

export default function CreatePetFormClient() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [fileMeta, setFileMeta] = useState<{
    sizeLabel: string;
    typeLabel: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setHasFile(Boolean(file));

    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });

    if (!file) {
      setFileMeta(null);
      return;
    }

    const sizeInMb = file.size / (1024 * 1024);
    setFileMeta({
      sizeLabel: `${sizeInMb.toFixed(2)} MB`,
      typeLabel: file.type || 'image/*',
    });
  }

  const textFieldStyle = {
    backgroundColor: '#16110e',
    color: '#ffffff',
    WebkitTextFillColor: '#ffffff',
    caretColor: '#ffffff',
  } as const;

  return (
    <form action={createPetAction} className='grid gap-6' encType='multipart/form-data'>
      <div className='grid gap-5 md:grid-cols-2'>
        <label className='grid gap-2 text-sm font-bold text-stone-100'>
          Name
          <input
            className={fieldClassName()}
            style={textFieldStyle}
            name='name'
            type='text'
            placeholder='e.g. Max'
            required
            maxLength={30}
            autoComplete='off'
          />
        </label>

        <label className='grid gap-2 text-sm font-bold text-stone-100'>
          Breed
          <input
            className={fieldClassName()}
            style={textFieldStyle}
            name='breed'
            type='text'
            placeholder='e.g. Shiba Inu'
            required
            maxLength={30}
            autoComplete='off'
          />
        </label>
      </div>

      <label className='grid gap-2 text-sm font-bold text-stone-100'>
        Personality
        <input
          className={fieldClassName()}
          style={textFieldStyle}
          name='personality'
          type='text'
          placeholder='e.g. Playful, clingy, loves belly rubs'
          required
          maxLength={120}
          autoComplete='off'
        />
      </label>

      <label className='grid gap-2 text-sm font-bold text-stone-100'>
        Favorite Food
        <input
          className={fieldClassName()}
          style={textFieldStyle}
          name='favoriteFood'
          type='text'
          placeholder='e.g. Chicken breast, freeze-dried treats'
          maxLength={120}
          autoComplete='off'
        />
      </label>

      <label className='grid gap-2 text-sm font-bold text-stone-100'>
        Daily Habits
        <textarea
          className={`${fieldClassName()} min-h-[128px] resize-y`}
          style={textFieldStyle}
          name='dailyHabits'
          placeholder='e.g. Loves waiting by the door, sleeps on the couch at night'
          maxLength={500}
          spellCheck={false}
        />
      </label>

      <div className='grid gap-2'>
        <div className='text-sm font-bold text-stone-100'>Upload Photo</div>

        <div className='rounded-[24px] border border-dashed border-amber-300/20 bg-gradient-to-b from-amber-300/6 to-white/4 px-5 py-6'>
          <input
            ref={fileInputRef}
            className='hidden'
            name='image'
            type='file'
            accept='image/png,image/jpeg,image/webp'
            required
            onChange={onFileChange}
          />

          <div className='flex flex-col items-center text-center'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-2xl'>
              📸
            </div>

            <p className='mt-4 text-sm font-extrabold text-amber-100'>
              Supports JPG / PNG / WebP, max 5MB
            </p>

            <p className='mt-2 max-w-xl text-xs leading-6 text-stone-400'>
              The image will be uploaded to Supabase Storage and attached to the pet profile.
            </p>

            <div className='mt-5 flex flex-wrap items-center justify-center gap-3'>
              <ChooseImageButton onClick={openPicker} hasFile={hasFile} />
              <span className='text-sm font-medium text-stone-300'>
                {hasFile ? '1 image selected' : 'No image selected'}
              </span>
            </div>

            {fileMeta ? (
              <div className='mt-3 inline-flex flex-wrap items-center gap-2 text-xs text-stone-400'>
                <span className='rounded-full border border-white/10 bg-white/5 px-2.5 py-1'>
                  {fileMeta.typeLabel}
                </span>
                <span className='rounded-full border border-white/10 bg-white/5 px-2.5 py-1'>
                  {fileMeta.sizeLabel}
                </span>
              </div>
            ) : null}

            {previewUrl ? (
              <div className='mt-5 w-full max-w-[320px] overflow-hidden rounded-[22px] border border-white/10 bg-black/20 shadow-lg shadow-black/20'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt='Selected pet preview'
                  className='h-[240px] w-full object-cover'
                />
              </div>
            ) : (
              <div className='mt-5 flex h-[220px] w-full max-w-[320px] items-center justify-center rounded-[22px] border border-white/8 bg-black/20 text-sm text-stone-500'>
                Image preview will appear here
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 text-sm leading-7 text-stone-300'>
        After successful creation, EchoPaws will save your pet to Supabase and automatically open the new pet chat with the correct{' '}
        <span className='font-bold text-amber-200'>pet_id</span>.
      </div>

      <div className='flex flex-wrap gap-3 pt-1'>
        <SubmitButton />

        <Link href='/memories' className={secondaryButtonClassName()}>
          Back to Memories
        </Link>
      </div>
    </form>
  );
}
