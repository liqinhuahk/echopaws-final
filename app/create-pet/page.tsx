'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

type CreatePetFormState = {
  name: string;
  breed: string;
  personality: string;
  favoriteFood: string;
  dailyHabits: string;
};

const initialFormState: CreatePetFormState = {
  name: '',
  breed: '',
  personality: '',
  favoriteFood: '',
  dailyHabits: '',
};

export default function CreatePetPage() {
  const [form, setForm] = useState<CreatePetFormState>(initialFormState);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoName, setPhotoName] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const completion = useMemo(() => {
    const fields = [
      form.name,
      form.breed,
      form.personality,
      form.favoriteFood,
      form.dailyHabits,
      photoPreview,
    ];
    const done = fields.filter(Boolean).length;
    return Math.round((done / fields.length) * 100);
  }, [form, photoPreview]);

  function updateField<K extends keyof CreatePetFormState>(key: K, value: CreatePetFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitted(false);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
    setPhotoName(file.name);
    setSubmitted(false);
  }

  function clearPhoto() {
    setPhotoPreview('');
    setPhotoName('');
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="page-noir app-brand-backdrop min-h-screen">
      <div className="container-shell py-8 md:py-14">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-[32px] border border-white/10 noir-hero px-6 py-7 shadow-2xl md:px-10 md:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="noir-pill mb-4 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.24em]">
                  ✦ Create Pet
                </div>

                <h1 className="noir-text-title text-4xl font-black tracking-[-0.05em] md:text-6xl">
                  Create your AI pet profile
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--noir-text-soft)] md:text-base">
                  Fill in a few details so EchoPaws can begin shaping memory, personality, routines, and a
                  richer emotional profile around your companion.
                </p>
              </div>

              <div className="w-full max-w-[280px] rounded-[24px] border border-white/10 bg-white/5 px-5 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--noir-text-muted)]">
                    Profile Completion
                  </span>
                  <span className="text-sm font-black text-[var(--noir-text-title)]">{completion}%</span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-300 transition-all"
                    style={{ width: `${completion}%` }}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-[var(--noir-text-soft)]">
                  A stronger pet profile helps EchoPaws deliver better memory continuity, tone, and context.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 rounded-[28px] noir-panel px-5 py-5 md:px-6 md:py-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g. Max"
                    className="noir-field h-12 rounded-2xl px-4 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Breed</label>
                  <input
                    type="text"
                    value={form.breed}
                    onChange={(e) => updateField('breed', e.target.value)}
                    placeholder="e.g. Shiba Inu"
                    className="noir-field h-12 rounded-2xl px-4 text-sm"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Personality</label>
                <input
                  type="text"
                  value={form.personality}
                  onChange={(e) => updateField('personality', e.target.value)}
                  placeholder="e.g. Playful, clingy, loves belly rubs"
                  className="noir-field h-12 rounded-2xl px-4 text-sm"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Favorite Food</label>
                <input
                  type="text"
                  value={form.favoriteFood}
                  onChange={(e) => updateField('favoriteFood', e.target.value)}
                  placeholder="e.g. Chicken breast, freeze-dried treats"
                  className="noir-field h-12 rounded-2xl px-4 text-sm"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Daily Habits</label>
                <textarea
                  value={form.dailyHabits}
                  onChange={(e) => updateField('dailyHabits', e.target.value)}
                  placeholder="e.g. Loves waiting by the door, sleeps on the couch at night"
                  className="noir-field min-h-[130px] rounded-2xl px-4 py-3 text-sm"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Upload Photo</label>

                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 px-5 py-5">
                  {!photoPreview ? (
                    <label className="block cursor-pointer text-center">
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-xl text-amber-200">
                        ⤴
                      </div>
                      <p className="text-sm font-semibold text-[var(--noir-text-title)]">Upload pet photo</p>
                      <p className="mt-2 text-xs text-[var(--noir-text-muted)]">
                        PNG / JPG recommended, front-facing photo preferred
                      </p>
                    </label>
                  ) : (
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="h-28 w-28 overflow-hidden rounded-[22px] border border-white/10 bg-white/10">
                        <img src={photoPreview} alt="Pet preview" className="h-full w-full object-cover" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[var(--noir-text-title)]">Photo ready</div>
                        <p className="mt-1 truncate text-sm text-[var(--noir-text-soft)]">{photoName}</p>
                        <p className="mt-2 text-xs leading-6 text-[var(--noir-text-muted)]">
                          You can keep this image or replace it before saving the profile.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <label className="subtle-button cursor-pointer">
                            Replace Photo
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                          </label>

                          <button type="button" onClick={clearPhoto} className="noir-danger-button rounded-full px-5 py-3 text-sm font-semibold">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[22px] noir-stat-card px-4 py-4">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--noir-text-muted)]">
                    Memory Ready
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--noir-text-title)]">
                    01
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--noir-text-soft)]">
                    Start with habits, food, and personality to improve recall quality.
                  </p>
                </div>

                <div className="rounded-[22px] noir-stat-card px-4 py-4">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--noir-text-muted)]">
                    Tone Match
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--noir-text-title)]">
                    High
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--noir-text-soft)]">
                    Richer profile details help the chat feel more emotionally consistent.
                  </p>
                </div>

                <div className="rounded-[22px] noir-stat-card px-4 py-4">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--noir-text-muted)]">
                    Visual ID
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--noir-text-title)]">
                    {photoPreview ? 'Ready' : 'Pending'}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--noir-text-soft)]">
                    A clear portrait gives your pet profile a stronger visual identity.
                  </p>
                </div>
              </div>

              {submitted ? (
                <div className="mt-6 rounded-[22px] noir-note-success px-5 py-4">
                  <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-200">
                    Draft Saved
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--noir-text-soft)]">
                    This page is now styled in the Noir system. If you already have a backend action, you can replace
                    the local submit handler with your existing save logic directly.
                  </p>
                </div>
              ) : (
                <div className="mt-6 rounded-[22px] noir-note px-5 py-4">
                  <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-200">
                    Styling Update
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--noir-text-soft)]">
                    This version focuses on visual consistency with the Noir theme while keeping the page self-contained
                    and safe to compile.
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link href="/pets" className="subtle-button">
                  Cancel
                </Link>
                <Link href="/chat" className="subtle-button">
                  Open Chat
                </Link>
                <button type="submit" className="brand-button">
                  Create Pet
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
