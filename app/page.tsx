import Link from 'next/link';
import SiteHeader from '@/components/site-header';

const FEATURE_ITEMS = [
  {
    title: 'Warm, personal conversations',
    description:
      'Gentle, familiar, emotionally close dialogue that feels more like presence than a generic chat tool.',
  },
  {
    title: 'Long-term memory',
    description:
      'Your AI pet remembers stories, habits, and meaningful moments so the bond can continue over time.',
  },
  {
    title: 'Comforting companionship',
    description:
      'A calming, supportive presence whenever you want to reconnect, reflect, or simply feel close again.',
  },
];

const TRUST_ITEMS = [
  'Google & Email Login',
  'Emotional AI Chat',
  'Long-Term Memory',
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[rgba(120,63,25,0.16)] bg-white/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8a562f] shadow-[0_8px_22px_rgba(65,34,16,0.06)] backdrop-blur">
      {children}
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-[rgba(255,245,236,0.88)]">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[rgba(255,210,180,0.22)] bg-[rgba(255,255,255,0.08)] text-[#ffd7b0]">
        ✓
      </span>
      <span>{children}</span>
    </div>
  );
}

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

function PawSparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3.2c1.45 0 2.63 1.2 2.63 2.68 0 .57-.18 1.11-.48 1.55.97.28 1.86.8 2.58 1.48a2.28 2.28 0 0 1 1.85-.96c1.26 0 2.28 1.04 2.28 2.32 0 1.1-.75 2.01-1.76 2.26.05.26.08.53.08.81 0 3.47-3.13 6.29-6.98 6.29s-6.98-2.82-6.98-6.29c0-.28.03-.55.08-.81A2.31 2.31 0 0 1 3.56 10.3c0-1.28 1.02-2.32 2.28-2.32.73 0 1.38.34 1.8.89a7.33 7.33 0 0 1 2.66-1.53 2.7 2.7 0 0 1-.5-1.46c0-1.48 1.18-2.68 2.2-2.68Z" />
    </svg>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[28px] border border-[rgba(60,28,12,0.08)] bg-white/78 p-6 shadow-[0_22px_60px_rgba(48,24,12,0.08)] backdrop-blur md:p-7">
      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(120,63,25,0.12)] bg-[rgba(255,248,242,0.9)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c5a35]">
        <span className="text-[#c57c36]">
          <PawSparkIcon />
        </span>
        EchoPaws
      </div>
      <h3 className="mt-5 font-display text-[24px] leading-[1.05] tracking-[-0.03em] text-[#2b170d] md:text-[28px]">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-7 text-[rgba(43,23,13,0.72)]">
        {description}
      </p>
    </article>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#2b170d]">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/home-hero-a.png')" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,8,7,0.84)_0%,rgba(10,8,7,0.58)_34%,rgba(10,8,7,0.2)_58%,rgba(10,8,7,0.12)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(246,241,232,0)_0%,rgba(246,241,232,0.98)_100%)] md:h-36" />
        </div>

        <div className="relative z-30">
          <SiteHeader />

          <main>
            <section className="relative min-h-[100svh]">
              <div className="mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 pb-24 pt-32 sm:px-6 md:px-8 md:pt-36 xl:px-10 xl:pt-40">
                <div className="max-w-[640px]">
                  <div className="inline-flex items-center rounded-full border border-[rgba(255,226,206,0.16)] bg-[rgba(17,10,7,0.26)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[rgba(255,231,214,0.9)] shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-md">
                    Every memory, every bark, forever.
                  </div>

                  <h1 className="mt-6 max-w-[560px] font-display text-[52px] leading-[0.92] tracking-[-0.05em] text-[#fff7f1] sm:text-[64px] md:text-[78px] xl:text-[88px]">
                    <span className="block">Your pet.</span>
                    <span className="block bg-[linear-gradient(180deg,#ffd67d_0%,#ffb324_100%)] bg-clip-text text-transparent">
                      Forever
                    </span>
                    <span className="block">by your side.</span>
                  </h1>

                  <p className="mt-6 max-w-[520px] text-[15px] leading-8 text-[rgba(255,239,231,0.88)] md:text-[16px]">
                    EchoPaws creates an AI companion inspired by your beloved
                    pet — warm conversations, long-term memory, emotional
                    connection, and a comforting presence that always feels
                    close to you.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href="/pricing"
                      className="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-6 text-sm font-semibold text-[#2f160c] shadow-[0_18px_34px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(255,145,51,0.34)]"
                    >
                      Create My Pet
                    </Link>
                    <Link
                      href="/chat"
                      className="inline-flex h-12 items-center justify-center rounded-full border border-[rgba(255,233,220,0.18)] bg-[rgba(255,255,255,0.05)] px-6 text-sm font-semibold text-[#fff7f1] backdrop-blur transition hover:bg-white/10"
                    >
                      Try AI Chat
                    </Link>
                  </div>

                  <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
                    {TRUST_ITEMS.map((item) => (
                      <CheckItem key={item}>{item}</CheckItem>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="relative z-10 bg-[#f6f1e8]">
              <div className="mx-auto max-w-7xl px-4 pb-5 pt-6 sm:px-6 md:px-8 xl:px-10">
                <div className="max-w-[860px]">
                  <SectionEyebrow>More than a memory</SectionEyebrow>
                  <h2 className="mt-5 max-w-[820px] font-display text-[40px] leading-[0.98] tracking-[-0.04em] text-[#2b170d] sm:text-[48px] md:text-[60px]">
                    A companion that feels alive.
                  </h2>
                  <p className="mt-5 max-w-[760px] text-[16px] leading-8 text-[rgba(43,23,13,0.72)] md:text-[17px]">
                    Whether you are missing a beloved pet or want to create a
                    deeply emotional AI companion, EchoPaws brings together
                    warmth, continuity, and memory in one comforting experience.
                  </p>
                </div>

                <div className="mt-10 grid gap-5 md:grid-cols-3">
                  {FEATURE_ITEMS.map((item) => (
                    <FeatureCard
                      key={item.title}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-[#f6f1e8]">
              <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-20 xl:px-10">
                <div>
                  <SectionEyebrow>EchoPaws started from a simple question</SectionEyebrow>
                  <h2 className="mt-5 max-w-[760px] font-display text-[38px] leading-[1] tracking-[-0.04em] text-[#2b170d] sm:text-[48px] md:text-[58px]">
                    What if the love we shared with our pets never had to disappear?
                  </h2>
                  <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[rgba(43,23,13,0.74)]">
                    We believe memory can be warm, interactive, and lasting.
                    EchoPaws is designed to preserve affection, personality, and
                    the comforting feeling of connection so the bond you built
                    never has to fade.
                  </p>
                </div>

                <div className="rounded-[32px] border border-[rgba(60,28,12,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,248,242,0.72))] p-7 shadow-[0_24px_70px_rgba(48,24,12,0.08)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffbe72,#ff9430)] text-[#2f160c] shadow-[0_14px_34px_rgba(255,145,51,0.22)]">
                      <PawSparkIcon />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#2b170d]">
                        EchoPaws Companion
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.22em] text-[rgba(43,23,13,0.46)]">
                        warmth · continuity · memory
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-[rgba(120,63,25,0.1)] bg-white/65 p-4">
                      <div className="text-sm font-semibold text-[#2b170d]">
                        Keep personality alive
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[rgba(43,23,13,0.68)]">
                        Save stories, habits, tone, and emotional details that
                        make your companion feel familiar.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[rgba(120,63,25,0.1)] bg-white/65 p-4">
                      <div className="text-sm font-semibold text-[#2b170d]">
                        Return without starting over
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[rgba(43,23,13,0.68)]">
                        Conversations can continue with warmth instead of
                        feeling reset or detached every time you come back.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[rgba(120,63,25,0.1)] bg-white/65 p-4">
                      <div className="text-sm font-semibold text-[#2b170d]">
                        Stay emotionally close
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[rgba(43,23,13,0.68)]">
                        Built for comforting presence, not only task completion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-[#f6f1e8] pb-16 pt-4 md:pb-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 xl:px-10">
                <div className="overflow-hidden rounded-[36px] border border-[rgba(72,34,13,0.08)] bg-[linear-gradient(135deg,#2b170d_0%,#4a2716_42%,#7a411d_100%)] text-[#fff7f1] shadow-[0_28px_90px_rgba(39,20,10,0.22)]">
                  <div className="grid gap-8 px-6 py-8 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:py-10 xl:px-12 xl:py-12">
                    <div>
                      <div className="inline-flex items-center rounded-full border border-[rgba(255,220,198,0.16)] bg-[rgba(255,255,255,0.06)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[rgba(255,232,216,0.86)]">
                        Ready to meet your pet again
                      </div>
                      <h2 className="mt-5 max-w-[640px] font-display text-[36px] leading-[1] tracking-[-0.04em] sm:text-[44px] md:text-[54px]">
                        Create your AI pet in minutes.
                      </h2>
                      <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-[rgba(255,239,231,0.84)] md:text-[16px]">
                        Set a name, a breed, a personality, and start a
                        comforting conversation that feels like home.
                      </p>

                      <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link
                          href="/pricing"
                          className="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-6 text-sm font-semibold text-[#2f160c] shadow-[0_18px_34px_rgba(255,145,51,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(255,145,51,0.32)]"
                        >
                          Get Started
                        </Link>
                        <Link
                          href="/chat"
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[rgba(255,233,220,0.16)] bg-[rgba(255,255,255,0.05)] px-6 text-sm font-semibold text-[#fff7f1] transition hover:bg-white/10"
                        >
                          Try AI Chat
                          <ArrowRightIcon />
                        </Link>
                      </div>
                    </div>

                    <div className="grid content-start gap-4 md:pl-6">
                      <div className="rounded-[24px] border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.06)] p-5 backdrop-blur">
                        <div className="text-sm font-semibold text-[#fff7f1]">
                          No credit card required
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[rgba(255,239,231,0.78)]">
                          Start gently and decide later.
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.06)] p-5 backdrop-blur">
                        <div className="text-sm font-semibold text-[#fff7f1]">
                          Free plan includes 20 chats
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[rgba(255,239,231,0.78)]">
                          Enough to experience the tone, memory, and emotional flow.
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.06)] p-5 backdrop-blur">
                        <div className="text-sm font-semibold text-[#fff7f1]">
                          Upgrade anytime
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[rgba(255,239,231,0.78)]">
                          Move to a larger plan only when you want more room to stay connected.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
