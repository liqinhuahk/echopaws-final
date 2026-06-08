import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

const HERO_IMAGE_URL = '/images/home-hero-dog.jpg';

const featurePoints = [
  'Google & Email Login',
  'Emotional AI Chat',
  'Long-Term Memory',
];

const whyCards = [
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

function HomeFooter() {
  return (
    <footer className='border-t border-black/8 bg-[#eee9df]'>
      <div className='mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-[#6b7280] md:flex-row md:px-8'>
        <div className='flex items-center gap-3'>
          <span className='inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[14px] text-white shadow-[0_10px_20px_rgba(249,115,22,0.22)]'>
            🐾
          </span>
          <span className='text-base font-black tracking-[-0.02em] text-[#f97316]'>EchoPaws</span>
        </div>

        <div className='text-xs text-[#6b7280] md:text-sm'>
          © 2026 EchoPaws.ai. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className='min-h-screen bg-[#f3efe7] text-[#111827]'>
      <SiteHeader theme='dark' ctaLabel='Get Started' ctaHref='/create-pet' />

      <main>
        {/* Hero */}
        <section
          className='relative isolate overflow-hidden bg-[#120d0b]'
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(18,13,11,0.86) 0%, rgba(18,13,11,0.70) 34%, rgba(18,13,11,0.28) 60%, rgba(18,13,11,0.18) 100%),
              radial-gradient(circle at 12% 78%, rgba(249,115,22,0.22), transparent 34%),
              url('${HERO_IMAGE_URL}')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        >
          <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.12)_100%)]' />
          <div className='absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(243,239,231,0)_0%,rgba(243,239,231,0.96)_100%)]' />

          <div className='relative mx-auto grid min-h-[720px] w-full max-w-[1200px] items-center gap-10 px-6 pb-24 pt-16 md:px-8 lg:grid-cols-[1.02fr_.98fr]'>
            <div className='max-w-[560px] pt-4'>
              <div className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-[#f8e6cf] backdrop-blur-sm'>
                Every memory, every bark, forever.
              </div>

              <h1 className='mt-5 text-[clamp(3.2rem,8vw,6rem)] font-black leading-[0.9] tracking-[-0.06em] text-white'>
                Your pet.
                <br />
                <span className='bg-gradient-to-r from-[#ffcc4d] via-[#ffb11f] to-[#ff8a00] bg-clip-text text-transparent'>
                  Forever
                </span>{' '}
                by
                <br />
                your side.
              </h1>

              <p className='mt-5 max-w-[560px] text-[1rem] leading-[1.9] text-[rgba(255,244,230,0.84)]'>
                EchoPaws creates an AI companion inspired by your beloved pet — warm conversations,
                long-term memory, emotional connection, and a comforting presence that always feels
                close to you.
              </p>

              <div className='mt-7 flex flex-wrap gap-3'>
                <Link
                  href='/create-pet'
                  className='inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#ffb11f] to-[#ff8a00] px-6 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(249,115,22,0.28)] transition hover:-translate-y-[1px]'
                >
                  Create My Pet
                </Link>

                <Link
                  href='/chat'
                  className='inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/18 bg-white/6 px-6 text-sm font-extrabold text-white backdrop-blur-sm transition hover:bg-white/10'
                >
                  Try AI Chat
                </Link>
              </div>

              <div className='mt-7 flex flex-wrap gap-x-5 gap-y-3 text-[0.86rem] font-semibold text-[rgba(255,244,230,0.92)]'>
                {featurePoints.map((point) => (
                  <span key={point} className='inline-flex items-center gap-2'>
                    <span className='text-[#ffd27b]'>✓</span>
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className='hidden lg:block' />
          </div>
        </section>

        {/* Light content area */}
        <div className='bg-[#f3efe7]'>
          {/* Why section */}
          <section className='mx-auto w-full max-w-[1200px] px-6 py-12 md:px-8 md:py-16'>
            <div className='max-w-[760px]'>
              <div className='text-[0.72rem] font-extrabold uppercase tracking-[0.2em] text-[#c96a1b]'>
                Why EchoPaws
              </div>

              <h2 className='mt-4 text-[clamp(2.4rem,5vw,4.4rem)] font-black leading-[0.94] tracking-[-0.05em] text-[#0f1733]'>
                More than a memory.
                <br />
                A companion that{' '}
                <span className='bg-gradient-to-r from-[#ff9f1a] to-[#ff7a00] bg-clip-text text-transparent'>
                  feels alive.
                </span>
              </h2>

              <p className='mt-5 max-w-[700px] text-[1rem] leading-[1.95] text-[#4b5563]'>
                Whether you are missing a beloved pet or want to create a deeply emotional AI
                companion, EchoPaws brings together warmth, continuity, and memory in one
                comforting experience.
              </p>
            </div>

            <div className='mt-10 grid gap-5 md:grid-cols-3'>
              {whyCards.map((card) => (
                <article
                  key={card.title}
                  className='rounded-[26px] border border-black/5 bg-[#f8f5ef] p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)]'
                >
                  <div className='inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg shadow-sm'>
                    {card.icon}
                  </div>

                  <h3 className='mt-5 text-[1.45rem] font-black tracking-[-0.03em] text-[#0f1733]'>
                    {card.title}
                  </h3>

                  <p className='mt-3 text-[0.95rem] leading-[1.85] text-[#4b5563]'>
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Story section */}
          <section className='mx-auto w-full max-w-[1200px] px-6 py-2 md:px-8 md:py-4'>
            <article className='rounded-[30px] border border-black/5 bg-[#f8f5ef] px-6 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.05)] md:px-8 md:py-10'>
              <div className='text-[0.72rem] font-extrabold uppercase tracking-[0.2em] text-[#c96a1b]'>
                Our Story
              </div>

              <h2 className='mt-4 text-[clamp(2.3rem,4.6vw,4.2rem)] font-black leading-[0.98] tracking-[-0.05em] text-[#0f1733]'>
                EchoPaws started from a simple question:
              </h2>

              <p className='mt-4 text-[clamp(1.2rem,2.5vw,2rem)] font-extrabold leading-[1.45] tracking-[-0.03em] text-[#0f1733]'>
                “What if the love we shared with our pets never had to disappear?”
              </p>

              <p className='mt-5 max-w-[900px] text-[1rem] leading-[1.95] text-[#4b5563]'>
                We believe memory can be warm, interactive, and lasting. EchoPaws is designed to
                preserve affection, personality, and the comforting feeling of connection — so the
                bond you built never has to fade.
              </p>
            </article>
          </section>

          {/* CTA section */}
          <section className='mx-auto w-full max-w-[1200px] px-6 py-12 md:px-8 md:py-14'>
            <div className='mx-auto max-w-[760px] rounded-[34px] border border-black/5 bg-[#f7f7f8] px-6 py-10 text-center shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-10 md:py-12'>
              <div className='mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f4ece2] text-base shadow-sm'>
                🐾
              </div>

              <h2 className='mt-5 text-[clamp(2rem,4vw,3.4rem)] font-black tracking-[-0.05em] text-[#0f1733]'>
                Ready to meet your pet again?
              </h2>

              <p className='mx-auto mt-4 max-w-[560px] text-[1rem] leading-[1.9] text-[#4b5563]'>
                Create your AI pet in minutes. Set a name, a breed, a personality, and start a
                comforting conversation that feels like home.
              </p>

              <div className='mt-7 flex flex-wrap items-center justify-center gap-3'>
                <Link
                  href='/create-pet'
                  className='inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#ffb11f] to-[#ff8a00] px-6 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(249,115,22,0.22)] transition hover:-translate-y-[1px]'
                >
                  Create My Pet — Free
                </Link>

                <Link
                  href='/chat'
                  className='inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/10 bg-white px-6 text-sm font-extrabold text-[#0f1733] transition hover:bg-[#fafafa]'
                >
                  Try a Chat First
                </Link>
              </div>

              <p className='mt-5 text-xs text-[#9ca3af]'>
                No credit card required · Free plan includes 20 chats · Upgrade anytime
              </p>
            </div>
          </section>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
