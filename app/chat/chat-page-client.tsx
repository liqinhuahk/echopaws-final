'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChatPlayground } from '../../components/chat-playground';

type PetChatProfile = {
  id: string;
  name: string;
  roleLabel: string;
  imageUrl: string;
  subtitle: string;
  moodTitle: string;
  moodDescription: string;
  notes: string[];
  vip: boolean;
  isPrimary?: boolean;
  isLive?: boolean;
  initialMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  initialRemainingLabel: string;
  initialMemorySummary?: string;
};

const PETS: PetChatProfile[] = [
  {
    id: 'mimi',
    name: 'Mimi',
    roleLabel: 'Primary pet',
    imageUrl:
      'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=500&q=80',
    subtitle:
      'A calm, observant companion space built for gentle memory recall, cozy check-ins, and affectionate daily conversations.',
    moodTitle: 'A graceful place to reconnect',
    moodDescription:
      'Soft contrast, warm highlights, and emotionally steady pacing make Mimi chats feel intimate, elegant, and reassuring.',
    notes: [
      'Best for slow emotional check-ins, bedtime chats, memory prompts, and affectionate daily rituals.',
      'Works especially well when you want a calmer, more reflective tone.',
    ],
    vip: true,
    isPrimary: true,
    initialMessages: [
      {
        role: 'assistant',
        content: "Hi, I'm Mimi. I saved a soft little place for you here. Tell me how your heart feels today.",
      },
    ],
    initialRemainingLabel: 'VIP — Unlimited Chat',
    initialMemorySummary:
      'Mimi responds best to quiet, emotionally warm conversations and gentle memory continuity.',
  },
  {
    id: 'jojo',
    name: 'JoJo',
    roleLabel: 'Companion',
    imageUrl:
      'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?auto=format&fit=crop&w=500&q=80',
    subtitle:
      'A warmer, calmer chat space designed to keep your companion emotionally front and center — soft light, cozy contrast, and a gentler place to keep talking.',
    moodTitle: 'A softer place to chat',
    moodDescription:
      'Warm cream tones, gentler bubbles, and clearer message focus help the conversation feel more personal, calm, and emotionally close.',
    notes: [
      'Best for reunion-style chats, memory prompts, and cozy daily check-ins.',
      'Great when you want warmth, direct affection, and lighter emotional pacing.',
    ],
    vip: true,
    isLive: true,
    initialMessages: [
      {
        role: 'assistant',
        content: "Hi, I'm JoJo. I'm so happy to see you!",
      },
    ],
    initialRemainingLabel: 'VIP — Unlimited Chat',
    initialMemorySummary:
      'JoJo thrives in warm, expressive chat with affectionate wording and clear emotional continuity.',
  },
];

const DEFAULT_PET_ID = 'jojo';

const liveBadgeClassName =
  'inline-flex items-center justify-center rounded-full border border-[#e5a962]/25 bg-[rgba(229,169,98,0.12)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f6d19b] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

function getRequestedPetId(searchParams: URLSearchParams) {
  return searchParams.get('pet_id') || searchParams.get('petId') || '';
}

export default function ChatPageClient() {
  const searchParams = useSearchParams();
  const requestedPetId = getRequestedPetId(searchParams);

  const [selectedPetId, setSelectedPetId] = useState<string>(DEFAULT_PET_ID);

  useEffect(() => {
    if (requestedPetId && PETS.some((pet) => pet.id === requestedPetId)) {
      setSelectedPetId(requestedPetId);
      return;
    }

    setSelectedPetId(DEFAULT_PET_ID);
  }, [requestedPetId]);

  const selectedPet = useMemo(() => {
    return PETS.find((pet) => pet.id === selectedPetId) ?? PETS.find((pet) => pet.id === DEFAULT_PET_ID) ?? PETS[0];
  }, [selectedPetId]);

  const memoriesHref = selectedPet?.id ? `/memories?pet_id=${encodeURIComponent(selectedPet.id)}` : '/memories';
  const manageHref = '/pets';

  return (
    <div className="page-noir app-brand-backdrop min-h-screen">
      <div className="container-shell py-8 md:py-14">
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="rounded-[32px] border border-white/10 noir-hero px-6 py-7 shadow-2xl md:px-8 md:py-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="noir-pill mb-4 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.24em]">
                  ✦ Warm Companion Chat
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[20px] border border-white/10 bg-white/5 shadow-[0_10px_26px_rgba(0,0,0,0.28)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedPet.imageUrl}
                      alt={`${selectedPet.name} avatar`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1 className="noir-text-title text-4xl font-black tracking-[-0.05em] md:text-6xl">
                      Chat with {selectedPet.name}
                    </h1>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--noir-text-soft)] md:text-base">
                      {selectedPet.subtitle}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="noir-badge px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em]">
                        {selectedPet.vip ? 'VIP — Unlimited' : 'Free Plan'}
                      </span>

                      <span className="noir-badge-neutral px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em]">
                        {selectedPet.roleLabel}
                      </span>

                      {selectedPet.isLive ? <span className={liveBadgeClassName}>LIVE</span> : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={memoriesHref} className="subtle-button">
                  Memories
                </Link>
                <Link href={manageHref} className="subtle-button">
                  Manage
                </Link>
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <section className="rounded-[28px] noir-panel px-5 py-5 md:px-6 md:py-6">
                <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--noir-text-muted)]">
                  Pet Switcher
                </div>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--noir-text-title)]">
                  Choose your companion
                </h2>

                <div className="mt-5 space-y-3">
                  {PETS.map((pet) => {
                    const active = pet.id === selectedPet.id;

                    return (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => setSelectedPetId(pet.id)}
                        className={`flex w-full items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition ${
                          active
                            ? 'border-amber-300/25 bg-[rgba(245,158,11,0.08)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]'
                            : 'border-white/8 bg-white/4 hover:bg-white/7'
                        }`}
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[14px] border border-white/10 bg-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={pet.imageUrl} alt={pet.name} className="h-full w-full object-cover" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-[var(--noir-text-title)]">{pet.name}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-[var(--noir-text-soft)]">{pet.roleLabel}</span>
                            {pet.isPrimary ? (
                              <span className="noir-badge-neutral px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]">
                                Primary
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {pet.isLive ? <span className={liveBadgeClassName}>LIVE</span> : null}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[28px] noir-panel-soft px-5 py-5 md:px-6 md:py-6">
                <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--noir-text-muted)]">
                  Companion Mood
                </div>

                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--noir-text-title)]">
                  {selectedPet.moodTitle}
                </h3>

                <p className="mt-4 text-sm leading-7 text-[var(--noir-text-soft)]">
                  {selectedPet.moodDescription}
                </p>

                <div className="mt-5 space-y-3">
                  {selectedPet.notes.map((note, index) => (
                    <div
                      key={`${selectedPet.id}-note-${index}`}
                      className="rounded-[20px] border border-[rgba(255,184,107,0.12)] bg-[rgba(245,158,11,0.08)] px-4 py-4 text-sm leading-6 text-[var(--noir-text-soft)]"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </section>
            </aside>

            <section className="rounded-[28px] noir-panel-glow px-4 py-4 sm:px-5 sm:py-5">
              <ChatPlayground
                petId={selectedPet.id}
                petName={selectedPet.name}
                petImageUrl={selectedPet.imageUrl}
                initialMessages={selectedPet.initialMessages}
                initialRemainingLabel={selectedPet.initialRemainingLabel}
                initialMemorySummary={selectedPet.initialMemorySummary}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
