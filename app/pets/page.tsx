'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type PetProfile = {
  id: string;
  name: string;
  breed: string;
  personality: string;
  favoriteFood: string;
  dailyHabits: string;
  summary: string;
  avatar: string;
  memories: number;
  conversations: number;
  isPrimary?: boolean;
};

const initialPets: PetProfile[] = [
  {
    id: 'mimi',
    name: 'Mimi',
    breed: 'Ragdoll Cat',
    personality: 'Elegant, clingy, gentle, quietly dramatic',
    favoriteFood: 'Salmon mousse and freeze-dried chicken',
    dailyHabits: 'Sleeps by the window in the afternoon and waits near the keyboard at night.',
    summary: 'Primary pet · Default chat companion · Emotionally observant and affectionate.',
    avatar: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=500&q=80',
    memories: 2,
    conversations: 1,
    isPrimary: true,
  },
  {
    id: 'cocoa',
    name: 'Cocoa',
    breed: 'Toy Poodle',
    personality: 'Alert, playful, energetic, loves attention',
    favoriteFood: 'Chicken breast and sweet potato bites',
    dailyHabits: 'Greets everyone at the door and gets excited before evening walks.',
    summary: 'Secondary pet · Highly social · Strong routine memory and playful tone.',
    avatar: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=500&q=80',
    memories: 2,
    conversations: 1,
  },
];

export default function PetsPage() {
  const [pets, setPets] = useState<PetProfile[]>(initialPets);
  const [selectedPetId, setSelectedPetId] = useState<string>(initialPets[0]?.id ?? '');

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? pets[0],
    [pets, selectedPetId]
  );

  const [draft, setDraft] = useState<PetProfile>(selectedPet);

  const stats = useMemo(() => {
    const totalMemories = pets.reduce((sum, pet) => sum + pet.memories, 0);
    const totalConversations = pets.reduce((sum, pet) => sum + pet.conversations, 0);

    return [
      {
        label: 'Total Pets',
        value: String(pets.length),
        description: `You currently manage ${pets.length} companion${pets.length > 1 ? 's' : ''}.`,
      },
      {
        label: 'Total Memories',
        value: String(totalMemories),
        description: 'Memories accumulated across pets and used to improve long-term continuity.',
      },
      {
        label: 'Total Conversations',
        value: String(totalConversations),
        description: 'Tracks how frequently each companion is interacted with over time.',
      },
      {
        label: 'Plan Status',
        value: 'VIP Active',
        description: 'VIP removes the Free-tier pet cap and unlocks a larger multi-pet workspace.',
      },
    ];
  }, [pets]);

  function selectPet(petId: string) {
    const pet = pets.find((item) => item.id === petId);
    if (!pet) return;
    setSelectedPetId(petId);
    setDraft(pet);
  }

  function updateDraft<K extends keyof PetProfile>(key: K, value: PetProfile[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function saveChanges() {
    setPets((prev) => prev.map((pet) => (pet.id === draft.id ? { ...draft } : pet)));
  }

  function removePet() {
    if (pets.length <= 1) return;

    const nextPets = pets.filter((pet) => pet.id !== draft.id);
    setPets(nextPets);
    const nextSelected = nextPets[0];
    if (nextSelected) {
      setSelectedPetId(nextSelected.id);
      setDraft(nextSelected);
    }
  }

  if (!selectedPet) {
    return (
      <div className="page-noir app-brand-backdrop min-h-screen">
        <div className="container-shell py-12">
          <div className="mx-auto max-w-3xl rounded-[32px] noir-panel px-8 py-10 text-center">
            <div className="noir-pill mx-auto mb-4 w-fit px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.24em]">
              ✦ Pet Manager
            </div>
            <h1 className="noir-text-title text-4xl font-black tracking-[-0.05em]">No Pets Yet</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--noir-text-soft)] md:text-base">
              Create your first EchoPaws companion to start building memories, personality, and a consistent AI bond.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/create-pet" className="brand-button">
                Create New Pet
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-noir app-brand-backdrop min-h-screen">
      <div className="container-shell py-8 md:py-14">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-[32px] border border-white/10 noir-hero px-6 py-7 shadow-2xl md:px-8 md:py-8">
            <div className="noir-pill mb-4 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.24em]">
              ✦ Pet Manager
            </div>

            <h1 className="noir-text-title text-4xl font-black tracking-[-0.05em] md:text-6xl">
              Manage Your EchoPaws Companions
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--noir-text-soft)] md:text-base">
              A unified multi-pet workspace for switching companions, checking summaries, and editing profiles —
              visually aligned with Home, Chat, Memories, Account, and Login.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/create-pet" className="brand-button">
                Add New Pet
              </Link>
              <Link href="/chat" className="subtle-button">
                Open Current Pet Chat
              </Link>
            </div>
          </section>

          <div className="mt-5 rounded-[24px] noir-note-success px-5 py-4">
            <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-200">VIP ACTIVE</div>
            <p className="mt-2 text-sm leading-6 text-[var(--noir-text-soft)]">
              Your account is currently on VIP. This manager is optimized for handling multiple pets, and your account
              is not limited by the Free-tier 2-pet cap.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[24px] noir-stat-card px-5 py-5">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--noir-text-muted)]">
                  {item.label}
                </div>
                <div className="mt-3 text-4xl font-black tracking-[-0.04em] text-[var(--noir-text-title)]">
                  {item.value}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--noir-text-soft)]">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <section className="rounded-[28px] noir-panel px-5 py-5 md:px-6 md:py-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--noir-text-muted)]">
                    Companion List
                  </div>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--noir-text-title)]">
                    Pet List
                  </h2>
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--noir-text-soft)]">
                  {pets.length} companion{pets.length > 1 ? 's' : ''}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {pets.map((pet) => {
                  const active = pet.id === selectedPetId;

                  return (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => selectPet(pet.id)}
                      className={`flex w-full items-center gap-4 rounded-[22px] border px-4 py-4 text-left transition ${
                        active
                          ? 'border-amber-300/20 bg-amber-500/10'
                          : 'border-white/8 bg-white/4 hover:bg-white/7'
                      }`}
                    >
                      <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                        <img src={pet.avatar} alt={pet.name} className="h-full w-full object-cover" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-lg font-bold text-[var(--noir-text-title)]">{pet.name}</span>
                          {pet.isPrimary ? (
                            <span className="noir-badge px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
                              Primary
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-sm text-[var(--noir-text-soft)]">{pet.summary}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="noir-badge-neutral px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
                            {pet.breed}
                          </span>
                          <span className="noir-badge-neutral px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
                            {pet.memories} memories
                          </span>
                          <span className="noir-badge-neutral px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
                            {pet.conversations} chats
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="rounded-[28px] noir-panel-soft px-5 py-5 md:px-6 md:py-6">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-[22px] border border-white/10 bg-white/10">
                  <img src={draft.avatar} alt={draft.name} className="h-full w-full object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-[var(--noir-text-title)]">
                    Edit Pet Profile
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--noir-text-soft)]">
                    Update name, breed, personality, preferences, and daily habits for the currently selected
                    companion.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Name</label>
                  <input
                    value={draft.name}
                    onChange={(e) => updateDraft('name', e.target.value)}
                    className="noir-field h-12 rounded-2xl px-4 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Breed</label>
                  <input
                    value={draft.breed}
                    onChange={(e) => updateDraft('breed', e.target.value)}
                    className="noir-field h-12 rounded-2xl px-4 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Personality</label>
                  <input
                    value={draft.personality}
                    onChange={(e) => updateDraft('personality', e.target.value)}
                    className="noir-field h-12 rounded-2xl px-4 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Favorite Food</label>
                  <input
                    value={draft.favoriteFood}
                    onChange={(e) => updateDraft('favoriteFood', e.target.value)}
                    className="noir-field h-12 rounded-2xl px-4 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--noir-text-soft)]">Daily Habits</label>
                  <textarea
                    value={draft.dailyHabits}
                    onChange={(e) => updateDraft('dailyHabits', e.target.value)}
                    className="noir-field min-h-[130px] rounded-2xl px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-[22px] noir-note px-4 py-4">
                <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-200">Profile Summary</div>
                <p className="mt-2 text-sm leading-6 text-[var(--noir-text-soft)]">
                  {draft.summary}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button type="button" onClick={saveChanges} className="brand-button">
                  Save Changes
                </button>
                <Link href="/chat" className="subtle-button">
                  Open Chat
                </Link>
                <button
                  type="button"
                  onClick={removePet}
                  disabled={pets.length <= 1}
                  className="noir-danger-button rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove Pet
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
