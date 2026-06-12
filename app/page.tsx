import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';

const FEATURE_ITEMS = [
  {
    icon: '💬',
    title: 'Emotional AI Chat',
    description:
      'Warm, personal conversations that feel gentle, familiar, and emotionally close.',
  },
  {
    icon: '🧠',
    title: 'Long-Term Memory',
    description:
      'Your AI pet remembers stories, habits, and meaningful moments over time.',
  },
  {
    icon: '❤️',
    title: 'Always by Your Side',
    description:
      'A comforting presence whenever you need support, companionship, or warmth.',
  },
];

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

function PawIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3.2c1.45 0 2.63 1.2 2.63 2.68 0 .57-.18 1.11-.48 1.55.97.28 1.86.8 2.58 1.48a2.28 2.28 0 0 1 1.85-.96c1.26 0 2.28 1.04 2.28 2.32 0 1.1-.75 2.01-1.76 2.26.05.26.08.53.08.81 0 3.47-3.13 6.29-6.98 6.29s-6.98-2.82-6.98-6.29c0-.28.03-.55.08-.81A2.31 2.31 0 0 1 3.56 10.3c0-1.28 1.02-2.32 2.28-2.32.73 0 1.38.34 1.8.89a7.33 7.33 0 0 1 2.66-1.53 2.7 2.7 0 0 1-.5-1.46c0-1.48 1.18-2.68 2.2-2.68Z" />
    </svg>
  );
}

function HeroTrustItem({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[12px] text-[rgba(255,241,232,0.92)]">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[rgba(255,230,210,0.16)] bg-[rgba(255,255,255,0.08)] text-[10px] text-[#ffd4aa]">
        ✓
      </span>
      <span>{children}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b86a2c]">
      {children}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[28px] border border-[rgba(50,28,16,0.05)] bg-[rgba(255,255,255,0.34)] p-5 shadow-[0_18px_40px_rgba(34,18,10,0.05)] backdrop-blur-sm md:p-6">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(53,30,17,0.05)] bg-[rgba(255,255,255,0.52)] text-[16px] shadow-sm">
        <span aria-hidden="true">{icon}</span>
      </div>

      <h3 className="mt-5 font-display text-[26px] leading-[1.02] tracking-[-0.03em] text-[#131834] md:text-[30px]">
        {title}
      </h3>

      <p className="mt-3 text-[14px] leading-7 text-[rgba(19,24,52,0.68)]">
        {description}
      </p>
    </article>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f2eee4] text-[#131834]">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="/images/home-hero-a.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="
                pointer-events-none select-none object-cover
                object-[78%_center]
                sm:object-[80%_center]
                md:object-[82%_center]
                lg:object-[84%_center]
                xl:object-[86%_center]
                2xl:object-[88%_center]
              "
            />
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,8,7,0.92)_0%,rgba(12,8,7,0.80)_22%,rgba(12,8,7,0.52)_42%,rgba(12,8,7,0.20)_68%,rgba(12,8,7,0.06)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_56%,rgba(255,129,28,0.22),transparent_28%),radial-gradient(circle_at_18%_100%,rgba(140,63,19,0.24),transparent_26%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(242,238,228,0)_0%,rgba(242,238,228,0.98)_100%)] md:h-32" />
        </div>

        <div className="relative z-20">
          <SiteHeader />

          <main>
            <section className="relative min-h-[100svh]">
              <div className="mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 pb-20 pt-28 sm:px-6 md:px-8 md:pb-24 md:pt-32 xl:px-10 xl:pt-36">
                <div className="max-w-[560px]">
                  <div className="inline-flex items-center rounded-full border border-[rgba(255,231,214,0.14)] bg-[rgba(17,10,7,0.22)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgba(255,231,214,0.9)] backdrop-blur-md">
                    Every memory, every bark, forever.
                  </div>

                  <h1 className="mt-6 font-display text-[54px] leading-[0.9] tracking-[-0.055em] text-[#fff8f2] sm:text-[68px] md:text-[82px] xl:text-[90px]">
                    <span className="block">Your pet.</span>
                    <span className="block bg-[linear-gradient(180deg,#ffd66f_0%,#ffb31e_100%)] bg-clip-text text-transparent">
                      Forever
                    </span>
                    <span className="block">by your side.</span>
                  </h1>

                  <p className="mt-6 max-w-[510px] text-[15px] leading-8 text-[rgba(255,240,231,0.88)] md:text-[16px]">
                    EchoPaws creates an AI companion inspired by your beloved pet —
                    warm conversations, long-term memory, emotional connection, and a
                    comforting presence that always feels close to you.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href="/pricing"
                      className="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbf73,#ff9835)] px-6 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.34)]"
                    >
                      Create My Pet
                    </Link>

                    <Link
                      href="/chat"
                      className="inline-flex h-12 items-center justify-center rounded-full border border-[rgba(255,233,220,0.16)] bg-[rgba(255,255,255,0.05)] px-6 text-sm font-semibold text-[#fff7f1] backdrop-blur transition hover:bg-white/10"
                    >
                      Try AI Chat
                    </Link>
                  </div>

                  <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
                    <HeroTrustItem>Google &amp; Email Login</HeroTrustItem>
                    <HeroTrustItem>Emotional AI Chat</HeroTrustItem>
                    <HeroTrustItem>Long-Term Memory</HeroTrustItem>
                  </div>
                </div>
              </div>
            </section>

            <section className="relative z-10 bg-[#f2eee4]">
              <div className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 md:px-8 md:pb-10 md:pt-12 xl:px-10">
                <div className="max-w-[760px]">
                  <SectionLabel>Why EchoPaws</SectionLabel>

                  <h2 className="mt-4 font-display text-[42px] leading-[0.98] tracking-[-0.045em] text-[#131834] sm:text-[54px] md:text-[64px]">
                    <span className="block">More than a memory.</span>
                    <span className="block">
                      A companion that{' '}
                      <span className="bg-[linear-gradient(180deg,#ffa53a_0%,#f27b10_100%)] bg-clip-text text-transparent">
                        feels alive.
                      </span>
                    </span>
                  </h2>

                  <p className="mt-5 max-w-[700px] text-[15px] leading-8 text-[rgba(19,24,52,0.66)] md:text-[16px]">
                    Whether you are missing a beloved pet or want to create a
                    deeply emotional AI companion, EchoPaws brings together
                    warmth, continuity, and memory in one comforting experience.
                  </p>
                </div>

                <div className="mt-10 grid gap-5 md:grid-cols-3">
                  {FEATURE_ITEMS.map((item) => (
                    <FeatureCard
                      key={item.title}
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-[#f2eee4] py-10 md:py-14">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 xl:px-10">
                <div className="rounded-[32px] border border-[rgba(53,30,17,0.05)] bg-[rgba(255,255,255,0.38)] px-6 py-7 shadow-[0_18px_42px_rgba(33,18,11,0.05)] backdrop-blur-sm md:px-8 md:py-8 lg:px-10">
                  <SectionLabel>Our Story</SectionLabel>

                  <h2 className="mt-4 max-w-[980px] font-display text-[38px] leading-[1.02] tracking-[-0.04em] text-[#131834] sm:text-[50px] md:text-[62px]">
                    EchoPaws started from a simple question:
                  </h2>

                  <p className="mt-4 max-w-[980px] font-display text-[24px] leading-[1.22] tracking-[-0.03em] text-[#131834] sm:text-[30px] md:text-[38px]">
                    “What if the love we shared with our pets never had to disappear?”
                  </p>

                  <p className="mt-6 max-w-[920px] text-[15px] leading-8 text-[rgba(19,24,52,0.68)] md:text-[16px]">
                    We believe memory can be warm, interactive, and lasting.
                    EchoPaws is designed to preserve affection, personality, and
                    the comforting feeling of connection — so the bond you built
                    never has to fade.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-[#f2eee4] px-4 pb-24 pt-10 sm:px-6 md:px-8 md:pt-16 xl:px-10">
              <div className="mx-auto max-w-3xl">
                <div className="rounded-[32px] border border-[rgba(53,30,17,0.05)] bg-[rgba(255,255,255,0.5)] px-6 py-9 text-center shadow-[0_18px_42px_rgba(33,18,11,0.05)] backdrop-blur-sm md:px-10 md:py-12">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(231,220,209,0.78)] text-[#745037]">
                    <PawIcon />
                  </div>

                  <h2 className="mt-6 font-display text-[40px] leading-[1.02] tracking-[-0.04em] text-[#131834] sm:text-[52px] md:text-[62px]">
                    Ready to meet your pet again?
                  </h2>

                  <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-8 text-[rgba(19,24,52,0.66)] md:text-[16px]">
                    Create your AI pet in minutes. Set a name, a breed, a
                    personality, and start a comforting conversation that feels
                    like home.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/pricing"
                      className="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbf73,#ff9a35)] px-6 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.28)]"
                    >
                      Create My Pet — Free
                    </Link>

                    <Link
                      href="/chat"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[rgba(19,24,52,0.1)] bg-white/72 px-6 text-sm font-semibold text-[#131834] transition hover:bg-white"
                    >
                      Try a Chat First
                      <ArrowRightIcon />
                    </Link>
                  </div>

                  <p className="mt-5 text-[12px] text-[rgba(19,24,52,0.42)]">
                    No credit card required • Free plan includes 20 chats • Upgrade anytime
                  </p>
                </div>
              </div>
            </section>
          </main>

          <footer className="border-t border-[rgba(53,30,17,0.04)] bg-[#f2eee4]">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-[13px] text-[rgba(19,24,52,0.5)] sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 xl:px-10">
              <Link href="/" className="inline-flex items-center gap-3 text-[#df8a32]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbf73,#ff9835)] text-[#2f160c] shadow-[0_10px_20px_rgba(255,145,51,0.18)]">
                  <PawIcon className="h-3.5 w-3.5" />
                </span>
                <span className="font-semibold">EchoPaws</span>
              </Link>

              <div>© 2026 EchoPaws.ai. All Rights Reserved.</div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
