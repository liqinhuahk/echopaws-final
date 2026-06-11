import Link from 'next/link';
import SiteHeader from '@/components/site-header';

type FeatureItem = {
  title: string;
  description: string;
};

type JourneyItem = {
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

const HERO_PILLS = [
  'Emotionally present',
  'Warm luxury UI',
  'Responsive across devices',
];

const FEATURE_ITEMS: FeatureItem[] = [
  {
    title: 'Calmer readability',
    description:
      'Soft contrast, cleaner hierarchy, and gentler typography so the whole product feels easier to stay with.',
  },
  {
    title: 'Companion-first design',
    description:
      'Every major action is centered on closeness, presence, and emotional continuity instead of generic chat mechanics.',
  },
  {
    title: 'Modern product structure',
    description:
      'A more stable SaaS-style layout across desktop and mobile without losing the warmth of the EchoPaws theme.',
  },
];

const JOURNEY_ITEMS: JourneyItem[] = [
  {
    label: 'Chat',
    title: 'Talk in a softer, more personal space',
    description:
      'A fixed, focused conversation layout with clearer message flow, steadier pet switching, and less visual interruption.',
    href: '/login?next=%2Fchat',
    cta: 'Open Chat',
  },
  {
    label: 'Memories',
    title: 'Keep meaningful moments easier to revisit',
    description:
      'Capture emotional patterns, memory updates, and shared moments in a way that feels organized instead of overwhelming.',
    href: '/memories',
    cta: 'Open Memories',
  },
  {
    label: 'Membership',
    title: 'Upgrade only when you want more room to stay connected',
    description:
      'A clearer path for plans, limits, and premium chat access without making the experience feel transactional.',
    href: '/pricing',
    cta: 'View Pricing',
  },
];

const EMOTIONAL_NOTES = [
  'Designed to feel warmer than a conventional dashboard.',
  'Built to reduce friction between returning, chatting, and remembering.',
  'Made to stay visually consistent across Home, Login, Chat, and future pages.',
];

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[rgba(255,214,182,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#efc39e] backdrop-blur-sm">
      {children}
    </div>
  );
}

function ArrowUpRightIcon() {
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
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function PawSparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l1.85 5.15L19 9l-5.15 1.85L12 16l-1.85-5.15L5 9l5.15-1.85L12 2Z" />
      <path d="M18.5 15l.92 2.58L22 18.5l-2.58.92L18.5 22l-.92-2.58L15 18.5l2.58-.92L18.5 15Z" />
      <path d="M5.5 14l.76 2.24L8.5 17l-2.24.76L5.5 20l-.76-2.24L2.5 17l2.24-.76L5.5 14Z" />
    </svg>
  );
}

function GlowIcon({
  children,
  warm = false,
}: {
  children: React.ReactNode;
  warm?: boolean;
}) {
  return (
    <div
      className={[
        'flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[0_14px_34px_rgba(0,0,0,0.22)]',
        warm
          ? 'border-[rgba(255,210,180,0.18)] bg-[linear-gradient(180deg,#ffbb70,#ff9531)] text-[#2f170c] shadow-[0_14px_34px_rgba(255,145,51,0.28)]'
          : 'border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.04)] text-[#f7d1ae]',
      ].join(' ')}
    >
      {children}
    </div>
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
    <div className="rounded-[28px] border border-[rgba(255,230,214,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e9bb96]">
        Feature
      </div>
      <h3 className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-[#fff6ef]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-8 text-[rgba(255,238,229,0.68)]">
        {description}
      </p>
    </div>
  );
}

function JourneyCard({
  label,
  title,
  description,
  href,
  cta,
}: JourneyItem) {
  return (
    <div className="rounded-[30px] border border-[rgba(255,233,220,0.12)] bg-[linear-gradient(180deg,rgba(24,12,9,0.84),rgba(12,7,6,0.92))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex items-center rounded-full border border-[rgba(255,196,140,0.16)] bg-[rgba(255,178,96,0.08)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f3c28e]">
          {label}
        </div>

        <GlowIcon>
          <ArrowUpRightIcon />
        </GlowIcon>
      </div>

      <h3 className="mt-5 text-[26px] font-semibold leading-tight tracking-[-0.04em] text-[#fff8f2]">
        {title}
      </h3>

      <p className="mt-4 text-[15px] leading-8 text-[rgba(255,239,231,0.68)]">
        {description}
      </p>

      <div className="mt-6">
        <Link
          href={href}
          className="inline-flex h-12 items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function HighlightCard({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-[30px] border border-[rgba(255,228,212,0.12)] bg-[linear-gradient(180deg,rgba(26,14,11,0.76),rgba(15,8,7,0.86))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#eabf9a]">
            EchoPaws feeling
          </div>
          <h3 className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-[#fff5ee]">
            {title}
          </h3>
        </div>

        <div className="rounded-full border border-[rgba(255,221,202,0.14)] bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[rgba(255,235,223,0.66)]">
          Home-aligned
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {lines.map((line, index) => (
          <div
            key={`${line}-${index}`}
            className="rounded-[20px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm leading-7 text-[rgba(255,239,231,0.68)]"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function DevicePreviewCard() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="absolute -inset-4 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(255,165,88,0.16),transparent_38%)] blur-2xl" />

      <div className="relative rounded-[34px] border border-[rgba(255,233,220,0.14)] bg-[linear-gradient(180deg,rgba(32,17,13,0.82),rgba(16,9,8,0.94))] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,214,182,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#efc39e]">
            Product preview
          </div>

          <div className="rounded-full border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] text-[rgba(255,234,224,0.6)]">
            Desktop + mobile ready
          </div>
        </div>

        <div className="mt-5 rounded-[26px] border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.03)] p-4">
          <div className="flex items-center gap-3">
            <GlowIcon warm>
              <PawSparkIcon />
            </GlowIcon>

            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#fff6ef]">
                EchoPaws Companion Space
              </div>
              <div className="mt-1 text-xs text-[rgba(255,236,226,0.58)]">
                Calm conversations, clearer memory flow, and a warmer visual system.
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f0c38f]">
                Chat
              </div>
              <p className="mt-2 text-sm leading-7 text-[rgba(255,240,232,0.66)]">
                Fixed-height message space with smoother reading and scroll control.
              </p>
            </div>

            <div className="rounded-[20px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f0c38f]">
                Memories
              </div>
              <p className="mt-2 text-sm leading-7 text-[rgba(255,240,232,0.66)]">
                Cleaner updates and more readable emotional continuity across visits.
              </p>
            </div>

            <div className="rounded-[20px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f0c38f]">
                Responsive
              </div>
              <p className="mt-2 text-sm leading-7 text-[rgba(255,240,232,0.66)]">
                Stable across desktop, laptop, tablet, and mobile without layout strain.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {HERO_PILLS.map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] font-medium text-[rgba(255,239,231,0.72)]"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0706] text-[#f8efe8]">
      <SiteHeader />

      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 md:px-8 md:pt-28 xl:px-10 xl:pt-32">
        <section className="grid items-center gap-10 xl:grid-cols-[1.04fr_0.96fr] xl:gap-12">
          <div className="pt-2 xl:pt-10">
            <SectionTag>Warm luxury companion platform</SectionTag>

            <h1 className="mt-6 max-w-[760px] text-balance text-[44px] font-semibold leading-[0.94] tracking-[-0.05em] text-[#fff8f2] md:text-[60px] xl:text-[78px]">
              A softer home for
              <br />
              companion chat,
              <br />
              memory, and{' '}
              <span className="bg-gradient-to-r from-[#ffd8b3] via-[#ffbe77] to-[#ff9440] bg-clip-text text-transparent">
                emotional continuity
              </span>
            </h1>

            <p className="mt-6 max-w-[660px] text-[15px] leading-8 text-[rgba(255,239,231,0.72)] md:text-[16px]">
              EchoPaws is designed to feel calmer than a generic AI interface — warmer in tone,
              clearer in structure, and more emotionally present across Home, Login, Chat, and
              the pages that connect them.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login?next=%2Fchat"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-6 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.32)]"
              >
                Start Chatting
              </Link>

              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-6 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
              >
                Explore Plans
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {HERO_PILLS.map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] font-medium text-[rgba(255,239,231,0.72)]"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <DevicePreviewCard />
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURE_ITEMS.map((item) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              description={item.description}
            />
          ))}
        </section>

        <section className="mt-8">
          <HighlightCard
            title="Less friction, more emotional presence"
            lines={EMOTIONAL_NOTES}
          />
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionTag>Core journey</SectionTag>
              <h2 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.04em] text-[#fff8f2] md:text-[46px]">
                Move through the product
                <br />
                without losing warmth
              </h2>
            </div>

            <p className="max-w-[520px] text-[15px] leading-8 text-[rgba(255,239,231,0.68)]">
              Every major path is designed to feel connected: enter gently, continue chatting
              clearly, revisit memory without clutter, and upgrade only when it feels useful.
            </p>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-3">
            {JOURNEY_ITEMS.map((item) => (
              <JourneyCard key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[34px] border border-[rgba(255,233,220,0.12)] bg-[linear-gradient(180deg,rgba(27,14,11,0.82),rgba(12,7,6,0.92))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8 xl:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
            <div>
              <SectionTag>Responsive foundation</SectionTag>

              <h2 className="mt-5 text-[34px] font-semibold leading-tight tracking-[-0.04em] text-[#fff8f2] md:text-[46px]">
                One visual system,
                <br />
                from desktop to mobile
              </h2>

              <p className="mt-5 max-w-[680px] text-[15px] leading-8 text-[rgba(255,239,231,0.7)]">
                This refreshed homepage is built to match the updated Login, Chat, Header, and
                global layout system — keeping spacing, typography, cards, CTA rhythm, and
                warm-dark contrast aligned across the whole EchoPaws experience.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/login?next=%2Fchat"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-6 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.32)]"
                >
                  Continue to Chat
                </Link>

                <Link
                  href="/memories"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-6 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
                >
                  Open Memories
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[24px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f0c38f]">
                  Typography
                </div>
                <p className="mt-3 text-sm leading-7 text-[rgba(255,240,232,0.64)]">
                  Softer body text and warmer display headlines for clearer reading and stronger product identity.
                </p>
              </div>

              <div className="rounded-[24px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f0c38f]">
                  Structure
                </div>
                <p className="mt-3 text-sm leading-7 text-[rgba(255,240,232,0.64)]">
                  Stable page rhythm across laptop and mobile, with less crowding and cleaner transitions between sections.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
