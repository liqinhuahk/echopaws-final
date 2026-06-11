'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import SiteHeader from '@/components/site-header';
import { ChatPlayground } from '@/components/chat-playground';

export type ChatPagePet = {
  id: string;
  name: string;
  roleLabel: string;
  imageUrl: string | null;
  subtitle: string;
  moodTitle: string;
  moodDescription: string;
  notes: string[];
  vip: boolean;
  isPrimary: boolean;
  isLive: boolean;
  initialMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  initialRemainingLabel: string;
  initialMemorySummary?: string;
};

type ChatPageClientProps = {
  initialPets: ChatPagePet[];
  initialSelectedPetId?: string | null;
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function PetAvatar({
  src,
  alt,
  fallbackText,
  size = 52,
}: {
  src?: string | null;
  alt: string;
  fallbackText: string;
  size?: number;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-2xl object-cover ring-1 ring-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,180,94,0.22),rgba(255,122,26,0.14))] text-base font-black uppercase text-[#ffe8d2] ring-1 ring-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
      style={{ width: size, height: size }}
      aria-label={`${alt} placeholder avatar`}
    >
      {fallbackText}
    </div>
  );
}

export default function ChatPageClient({
  initialPets,
  initialSelectedPetId,
}: ChatPageClientProps) {
  const pets = initialPets ?? [];

  const activePet = useMemo(() => {
    if (!pets.length) return null;

    return (
      (initialSelectedPetId &&
        pets.find((pet) => String(pet.id) === String(initialSelectedPetId))) ||
      pets.find((pet) => pet.isPrimary) ||
      pets[0]
    );
  }, [pets, initialSelectedPetId]);

  if (!activePet) {
    return (
      <div className="min-h-screen bg-[#0b0706] text-[#f7efe8]">
        <SiteHeader theme="dark" />
        <main className="mx-auto w-full max-w-[1240px] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
          <div className="rounded-[30px] border border-white/10 bg-[rgba(18,11,9,0.78)] px-6 py-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
            <h1
              className="text-[2.2rem] leading-[1] tracking-[-0.04em] text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No companion available
            </h1>
            <p className="mx-auto mt-4 max-w-[620px] text-[15px] leading-8 text-[rgba(255,244,230,0.72)]">
              We could not load a valid pet profile for chat. Please return to pet setup and try again.
            </p>
            <Link
              href="/create-pet"
              className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[linear-gradient(90deg,#ffb45e_0%,#ff9330_50%,#ff7a1a_100%)] px-6 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(249,115,22,0.25)] transition hover:-translate-y-[1px] hover:brightness-105"
            >
              Create Pet
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0706] text-[#f7efe8]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(255,122,26,0.10),transparent_24%),radial-gradient(circle_at_88%_16%,rgba(255,181,94,0.08),transparent_20%),linear-gradient(180deg,#0b0706_0%,#140a08_52%,#0b0706_100%)]" />
      <SiteHeader theme="dark" />

      <main className="relative z-[1] mx-auto w-full max-w-[1240px] px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-7">
          <div className="inline-flex items-center rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#f6cf7b]">
            Warm companion chat
          </div>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <PetAvatar
                src={activePet.imageUrl}
                alt={activePet.name}
                fallbackText={activePet.name.slice(0, 1)}
                size={64}
              />

              <div className="min-w-0">
                <h1
                  className="text-[clamp(2.3rem,4vw,4.4rem)] leading-[0.94] tracking-[-0.045em] text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Chat with {activePet.name}
                </h1>

                <p className="mt-3 max-w-3xl text-[15px] leading-8 text-[rgba(255,244,230,0.78)]">
                  {activePet.subtitle}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-[#f6cf7b]">
                    Real pet data
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-[rgba(255,244,230,0.80)]">
                    {activePet.vip ? 'VIP — Unlimited Chat' : 'Companion chat'}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-[rgba(255,244,230,0.80)]">
                    {activePet.isPrimary ? 'Primary pet' : activePet.roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href={`/memories?pet_id=${encodeURIComponent(activePet.id)}`}
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/14 bg-white/[0.04] px-5 text-sm font-bold text-white transition hover:bg-white/[0.07]"
              >
                Open Memories
              </Link>
              <Link
                href="/account"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-[linear-gradient(90deg,#ffb45e_0%,#ff9330_50%,#ff7a1a_100%)] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(249,115,22,0.26)] transition hover:-translate-y-[1px] hover:brightness-105"
              >
                Manage Membership
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="grid gap-5">
            <section className="rounded-[30px] border border-white/8 bg-[rgba(18,11,9,0.76)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl">
              <div className="text-[0.64rem] font-extrabold uppercase tracking-[0.24em] text-[#f3c86b]">
                Pet switcher
              </div>

              <h2
                className="mt-3 text-[2rem] leading-[0.98] tracking-[-0.045em] text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Choose your companion
              </h2>

              <div className="mt-5 grid gap-3">
                {pets.map((pet) => {
                  const active = pet.id === activePet.id;

                  return (
                    <Link
                      key={pet.id}
                      href={`/chat?pet_id=${encodeURIComponent(pet.id)}`}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'rounded-[22px] border px-4 py-3 transition duration-200',
                        active
                          ? 'border-amber-300/28 bg-[linear-gradient(135deg,rgba(255,180,94,0.10),rgba(255,122,26,0.07))] shadow-[0_10px_28px_rgba(249,115,22,0.12)]'
                          : 'border-white/8 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <PetAvatar
                          src={pet.imageUrl}
                          alt={pet.name}
                          fallbackText={pet.name.slice(0, 1)}
                          size={48}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-extrabold text-white">{pet.name}</div>
                          <div className="text-xs text-[rgba(255,244,230,0.62)]">
                            {pet.isPrimary ? 'Primary pet' : pet.roleLabel}
                          </div>
                        </div>

                        {active ? (
                          <span className="inline-flex items-center rounded-full border border-amber-300/28 bg-amber-300/12 px-3 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-[#f6cf7b]">
                            {pet.isLive ? 'Live' : 'Active'}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/8 bg-[rgba(18,11,9,0.76)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl">
              <div className="text-[0.64rem] font-extrabold uppercase tracking-[0.24em] text-[#f3c86b]">
                Companion mood
              </div>

              <h3
                className="mt-3 text-[2rem] leading-[0.98] tracking-[-0.045em] text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {activePet.moodTitle}
              </h3>

              <p className="mt-4 text-[15px] leading-8 text-[rgba(255,244,230,0.78)]">
                {activePet.moodDescription}
              </p>

              {activePet.notes.length ? (
                <div className="mt-5 grid gap-3">
                  {activePet.notes.map((note, index) => (
                    <div
                      key={`${activePet.id}-note-${index}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[rgba(255,244,230,0.74)]"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </aside>

          <section className="rounded-[30px] border border-white/10 bg-[rgba(18,11,9,0.76)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-5">
            <ChatPlayground
              key={activePet.id}
              petId={activePet.id}
              petName={activePet.name}
              petImageUrl={activePet.imageUrl}
              initialMessages={activePet.initialMessages}
              initialRemainingLabel={activePet.initialRemainingLabel}
              initialMemorySummary={activePet.initialMemorySummary}
            />
          </section>
        </section>
      </main>
    </div>
  );
}
