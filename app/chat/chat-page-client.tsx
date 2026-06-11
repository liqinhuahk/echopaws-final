'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { ChatPlayground } from '@/components/chat-playground';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type PetProfile = {
  id: string;
  name: string;
  imageUrl?: string | null;
  subtitle: string;
  description: string;
  badges: string[];
  isPrimary: boolean;
  isLive: boolean;
  moodTitle: string;
  moodDescription: string;
  notes: string[];
  initialMessages: ChatMessage[];
  initialRemainingLabel: string;
  initialMemorySummary: string;
};

type ChatPageClientProps = {
  pets: PetProfile[];
  initialPetId?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function buildPetHref(pathname: string, searchParams: ReadonlyURLSearchParams, petId: string) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('petId', petId);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function PetAvatar({
  name,
  imageUrl,
  size = 'md',
}: {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClass =
    size === 'sm'
      ? 'h-10 w-10'
      : size === 'lg'
        ? 'h-16 w-16'
        : size === 'xl'
          ? 'h-20 w-20'
          : 'h-12 w-12';

  const initial = name.trim().charAt(0).toUpperCase() || 'P';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          sizeClass,
          'rounded-full border border-white/10 object-cover shadow-[0_12px_30px_rgba(0,0,0,0.22)]'
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        'flex items-center justify-center rounded-full border border-[rgba(255,209,174,0.24)]',
        'bg-[linear-gradient(180deg,#f6d2b0,#c68444)] text-[#2d170c] shadow-[0_12px_30px_rgba(0,0,0,0.22)]',
        size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-xl' : 'text-base',
        'font-semibold'
      )}
    >
      {initial}
    </div>
  );
}

function Badge({ children, warm = false }: { children: string; warm?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium',
        warm
          ? 'border border-[rgba(255,196,140,0.16)] bg-[rgba(255,178,96,0.08)] text-[#f3c28e]'
          : 'border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,239,231,0.72)]'
      )}
    >
      {children}
    </span>
  );
}

function CompanionCard({
  pet,
  active,
  onSelect,
  compact = false,
}: {
  pet: PetProfile;
  active: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-[22px] border text-left transition',
        active
          ? 'border-[rgba(255,191,120,0.45)] bg-[rgba(255,174,96,0.08)] shadow-[0_18px_38px_rgba(255,145,51,0.18)]'
          : 'border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,191,120,0.22)] hover:bg-[rgba(255,255,255,0.03)]',
        compact ? 'min-w-[220px] p-3' : 'p-4'
      )}
    >
      <div className="flex items-center gap-3">
        <PetAvatar name={pet.name} imageUrl={pet.imageUrl} size={compact ? 'md' : 'lg'} />

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[#fff6ef]">{pet.name}</div>
          <div className="truncate text-xs text-[rgba(255,236,226,0.56)]">
            {pet.subtitle}
          </div>
        </div>

        {active ? (
          <span className="inline-flex shrink-0 rounded-full border border-[rgba(255,191,120,0.22)] bg-[rgba(255,178,96,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f3c28e]">
            Active
          </span>
        ) : null}
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0706] text-[#f8efe8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(255,148,67,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(255,175,96,0.10),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(255,120,64,0.08),transparent_32%)]" />
      <SiteHeader />

      <main className="relative mx-auto max-w-7xl px-6 pb-16 pt-24 md:px-8 md:pt-28 xl:px-10 xl:pt-32">
        <div className="rounded-[32px] border border-[rgba(255,233,220,0.12)] bg-[linear-gradient(180deg,rgba(27,14,11,0.82),rgba(12,7,6,0.92))] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-10">
          <div className="max-w-[720px]">
            <div className="inline-flex items-center rounded-full border border-[rgba(255,214,182,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#efc39e]">
              Chat
            </div>

            <h1 className="mt-6 text-[34px] font-semibold leading-tight tracking-[-0.04em] text-[#fff8f2] md:text-[48px]">
              Your companion space is ready —
              <br />
              just add a pet first.
            </h1>

            <p className="mt-5 max-w-[600px] text-[15px] leading-8 text-[rgba(255,239,231,0.7)]">
              Once your pet profile is available, this page will automatically turn into the full
              responsive chat experience with preserved chat history, fixed-height message scrolling,
              and cleaner memory updates.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/account"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-6 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5"
              >
                Go to Account
              </Link>

              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-6 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarMoodCard({ pet }: { pet: PetProfile }) {
  return (
    <section className="rounded-[28px] border border-[rgba(255,233,220,0.12)] bg-[linear-gradient(180deg,rgba(24,12,9,0.84),rgba(12,7,6,0.92))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e9bb96]">
        Companion mood
      </div>

      <h3 className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-[#fff6ef]">
        {pet.moodTitle}
      </h3>

      <p className="mt-3 text-sm leading-8 text-[rgba(255,239,231,0.68)]">
        {pet.moodDescription}
      </p>

      <div className="mt-5 grid gap-3">
        {pet.notes.map((note, index) => (
          <div
            key={`${note}-${index}`}
            className="rounded-[20px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm leading-7 text-[rgba(255,240,232,0.62)]"
          >
            {note}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ChatPageClient({
  pets,
  initialPetId,
}: ChatPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedPetId =
    searchParams.get('petId') ||
    initialPetId ||
    pets.find((pet) => pet.isPrimary)?.id ||
    pets[0]?.id;

  const activePet = useMemo(() => {
    return (
      pets.find((pet) => pet.id === selectedPetId) ||
      pets.find((pet) => pet.isPrimary) ||
      pets[0]
    );
  }, [pets, selectedPetId]);

  function handleSelectPet(petId: string) {
    if (!petId || petId === activePet?.id) return;
    router.replace(buildPetHref(pathname, searchParams, petId), { scroll: false });
  }

  if (!activePet) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0706] text-[#f8efe8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(255,148,67,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(255,175,96,0.10),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(255,120,64,0.08),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />

      <SiteHeader />

      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 md:px-8 md:pt-28 xl:px-10 xl:pt-32">
        <section className="rounded-[32px] border border-[rgba(255,233,220,0.12)] bg-[linear-gradient(180deg,rgba(27,14,11,0.82),rgba(12,7,6,0.92))] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-6 xl:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-4">
                <PetAvatar name={activePet.name} imageUrl={activePet.imageUrl} size="xl" />

                <div className="min-w-0">
                  <div className="inline-flex items-center rounded-full border border-[rgba(255,214,182,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#efc39e]">
                    Companion chat
                  </div>

                  <h1 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.04em] text-[#fff8f2] md:text-[48px] xl:text-[56px]">
                    Chat with {activePet.name}
                  </h1>

                  <p className="mt-3 max-w-[720px] text-[15px] leading-8 text-[rgba(255,239,231,0.7)]">
                    {activePet.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {activePet.badges.map((badge, index) => (
                      <Badge key={`${badge}-${index}`} warm={index === 0}>
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <Link
                href="/memories"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-6 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
              >
                Open Memories
              </Link>

              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-6 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5"
              >
                Manage Membership
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 xl:hidden">
          <div className="rounded-[28px] border border-[rgba(255,233,220,0.12)] bg-[linear-gradient(180deg,rgba(24,12,9,0.84),rgba(12,7,6,0.92))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e9bb96]">
              Pet switcher
            </div>

            <h2 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#fff6ef]">
              Choose your companion
            </h2>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {pets.map((pet) => (
                <CompanionCard
                  key={pet.id}
                  pet={pet}
                  active={pet.id === activePet.id}
                  onSelect={() => handleSelectPet(pet.id)}
                  compact
                />
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden xl:flex xl:flex-col xl:gap-6">
            <section className="rounded-[28px] border border-[rgba(255,233,220,0.12)] bg-[linear-gradient(180deg,rgba(24,12,9,0.84),rgba(12,7,6,0.92))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e9bb96]">
                Pet switcher
              </div>

              <h2 className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-[#fff6ef]">
                Choose your companion
              </h2>

              <div className="mt-5 space-y-3">
                {pets.map((pet) => (
                  <CompanionCard
                    key={pet.id}
                    pet={pet}
                    active={pet.id === activePet.id}
                    onSelect={() => handleSelectPet(pet.id)}
                  />
                ))}
              </div>
            </section>

            <SidebarMoodCard pet={activePet} />
          </aside>

          <div className="min-w-0 space-y-6">
            <div className="xl:hidden">
              <SidebarMoodCard pet={activePet} />
            </div>

            <ChatPlayground
              petId={activePet.id}
              petName={activePet.name}
              petImageUrl={activePet.imageUrl}
              initialMessages={activePet.initialMessages}
              initialRemainingLabel={activePet.initialRemainingLabel}
              initialMemorySummary={activePet.initialMemorySummary}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
