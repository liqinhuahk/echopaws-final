import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

const HERO_IMAGE_URL = '/images/home-hero-a.png';

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

function FooterBrandMark() {
  const paw = (x: number, y: number, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx='6.2' cy='4.8' r='1.55' />
      <circle cx='9.2' cy='3.2' r='1.45' />
      <circle cx='12.2' cy='4.8' r='1.55' />
      <ellipse cx='9.1' cy='10.2' rx='3.6' ry='2.95' />
    </g>
  );

  return (
    <svg
      viewBox='0 0 32 32'
      aria-hidden='true'
      className='h-[18px] w-[18px] shrink-0 text-[#3d2a1d]'
      fill='currentColor'
    >
      <g transform='rotate(-18 16 16)'>
        {paw(2.4, 2.2, 0.85)}
        {paw(11.8, 11.2, 0.92)}
      </g>
    </svg>
  );
}

function HomeFooter() {
  return (
    <footer className='border-t border-black/8 bg-[#ece6da]'>
      <div className='mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-[#6b7280] md:flex-row md:px-8'>
        <Link href='/' className='flex items-center gap-3'>
          <span className='inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 shadow-[0_10px_24px_rgba(249,115,22,0.22)]'>
            <FooterBrandMark />
          </span>
          <span className='text-base font-black tracking-[-0.02em] text-[#f08a1c]'>
            EchoPaws
          </span>
        </Link>

        <div className='text-xs text-[#6b7280] md:text-sm'>
          © 2026 EchoPaws.ai. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className='min-h-screen bg-[#f6f1e8] text-white'>
      <div className='relative isolate min-h-screen overflow-hidden'>
        {/* 背景层：只负责视觉，不可拦截点击 */}
        <div className='pointer-events-none absolute inset-0 z-0'>
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
          />
          <div className='absolute inset-0 bg-[linear-gradient(90deg,rgba(10,8,7,0.82)_0%,rgba(10,8,7,0.55)_36%,rgba(10,8,7,0.18)_58%,rgba(10,8,7,0.10)_100%)]' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.14),transparent_30%)]' />
          <div className='absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(246,241,232,0)_0%,rgba(246,241,232,0.96)_100%)]' />
        </div>

        {/* 桌面 Header：抬高层级，保证可点击 */}
        <div className='relative z-30 hidden md:block'>
          <SiteHeader theme='dark' ctaLabel='Get Started' ctaHref='/create-pet' />
        </div>

        {/* Hero 主内容：抬高层级，保证所有按钮可点 */}
        <main className='relative z-20'>
          <section className='container-shell flex min-h-[calc(100vh-96px)] items-center py-10 md:py-16'>
            <div className='grid w-full items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]'>
              <div className='max-w-[640px]'>
                <div className='inline-flex items-center rounded-full border border-white/20 bg-white/8 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.22em] text-[#ffd089] shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm'>
                  Every memory, every bark, forever.
                </div>

                <h1 className='mt-6 text-[clamp(3.2rem,8vw,6rem)] font-black leading-[0.9] tracking-[-0.07em] text-white'>
                  <span className='block'>Your pet.</span>
                  <span className='mt-1 block whitespace-nowrap'>
                    <span className='text-[#ffbf1f]'>Forever</span> by
                  </span>
                  <span className='block whitespace-nowrap'>your side.</span>
                </h1>

                <p className='mt-6 max-w-[560px] text-[1rem] leading-[1.95] text-white/84 md:text-[1.04rem]'>
                  EchoPaws creates an AI companion inspired by your beloved pet — warm
                  conversations, long-term memory, emotional connection, and a comforting presence
                  that always feels close to you.
                </p>

                <div className='relative z-20 mt-8 flex flex-wrap gap-3'>
                  <Link
                    href='/create-pet'
                    className='inline-flex min-h-[50px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffb020_0%,#f97316_100%)] px-6 py-3 text-[0.96rem] font-extrabold text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:-translate-y-[1px] hover:brightness-105'
                  >
                    Create My Pet
                  </Link>

                  <Link
                    href='/chat'
                    className='inline-flex min-h-[50px] items-center justify-center rounded-full border border-white/32 bg-white/10 px-6 py-3 text-[0.96rem] font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur-sm transition hover:bg-white/14'
                  >
                    Try AI Chat
                  </Link>
                </div>

                <div className='mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white/88'>
                  {featurePoints.map((point) => (
                    <div key={point} className='inline-flex items-center gap-2'>
                      <span className='text-white'>✓</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className='hidden lg:block' />
            </div>
          </section>
        </main>
      </div>

      {/* Why EchoPaws */}
      <section className='bg-[#f7f2e8] py-16 text-slate-900 md:py-20'>
        <div className='container-shell'>
          <div className='max-w-3xl'>
            <div className='text-xs font-extrabold uppercase tracking-[0.18em] text-orange-700'>
              Why EchoPaws
            </div>

            <h2 className='mt-4 text-[clamp(2.2rem,4vw,4rem)] font-black leading-[1.02] tracking-[-0.05em] text-slate-900'>
              More than a memory.
              <br />
              A companion that <span className='text-orange-500'>feels alive.</span>
            </h2>

            <p className='mt-5 max-w-3xl text-[1rem] leading-[1.95] text-slate-600'>
              Whether you are missing a beloved pet or want to create a deeply emotional AI
              companion, EchoPaws brings together warmth, continuity, and memory in one comforting
              experience.
            </p>
          </div>

          <div className='mt-10 grid gap-5 md:grid-cols-3'>
            {whyCards.map((card) => (
              <article
                key={card.title}
                className='rounded-[28px] border border-white/55 bg-white/88 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-md'
              >
                <div className='inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl shadow-sm'>
                  {card.icon}
                </div>

                <h3 className='mt-5 text-2xl font-extrabold tracking-[-0.03em] text-slate-900'>
                  {card.title}
                </h3>

                <p className='mt-3 text-sm leading-7 text-slate-600'>{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className='bg-[#f3ede1] py-16 text-slate-900 md:py-20'>
        <div className='container-shell'>
          <div className='rounded-[34px] border border-white/60 bg-[#fbf7ef] px-8 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-10 md:py-12'>
            <div className='text-xs font-extrabold uppercase tracking-[0.18em] text-orange-700'>
              Our Story
            </div>

            <h2 className='mt-4 text-[clamp(2rem,4vw,3.5rem)] font-black leading-[1.05] tracking-[-0.05em] text-slate-900'>
              EchoPaws started from a simple question:
            </h2>

            <p className='mt-5 text-[clamp(1.2rem,2vw,1.7rem)] font-bold leading-[1.6] text-slate-900'>
              “What if the love we shared with our pets never had to disappear?”
            </p>

            <p className='mt-6 max-w-4xl text-[1rem] leading-[1.95] text-slate-600'>
              We believe memory can be warm, interactive, and lasting. EchoPaws is designed to
              preserve affection, personality, and the comforting feeling of connection — so the
              bond you built never has to fade.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='bg-[#ece7dc] py-16 text-slate-900 md:py-20'>
        <div className='container-shell'>
          <div className='mx-auto max-w-[760px] rounded-[34px] border border-white/70 bg-[#fbfbfb] px-6 py-10 text-center shadow-[0_22px_48px_rgba(15,23,42,0.08)] md:px-10 md:py-12'>
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
        </div>
      </section>

      {/* Contact 锚点区：让 Header 的 Contact 可点击并有实际落点 */}
      <section id='contact' className='bg-[#eae4d7] py-16 text-slate-900 md:py-20'>
        <div className='container-shell'>
          <div className='rounded-[30px] border border-white/60 bg-[#f9f5ee] px-8 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.05)] md:px-10 md:py-12'>
            <div className='text-xs font-extrabold uppercase tracking-[0.18em] text-orange-700'>
              Contact
            </div>

            <h2 className='mt-4 text-[clamp(1.9rem,3.8vw,3.2rem)] font-black leading-[1.05] tracking-[-0.05em] text-[#0f1733]'>
              Need help getting started with EchoPaws?
            </h2>

            <p className='mt-5 max-w-3xl text-[1rem] leading-[1.9] text-[#4b5563]'>
              Start by creating your first AI pet, explore the Free plan, or review membership
              options if you want deeper memory and uninterrupted companionship.
            </p>

            <div className='mt-7 flex flex-wrap gap-3'>
              <Link
                href='/create-pet'
                className='inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#ffb11f] to-[#ff8a00] px-6 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(249,115,22,0.20)] transition hover:-translate-y-[1px]'
              >
                Create My Pet
              </Link>

              <Link
                href='/pricing'
                className='inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/10 bg-white px-6 text-sm font-extrabold text-[#0f1733] transition hover:bg-[#fafafa]'
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
    </div>
  );
}
