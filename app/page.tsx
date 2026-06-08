import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

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

export default function HomePage() {
  return (
    <div className='min-h-screen bg-[#f6f1e8] text-white'>
      <div className='relative isolate min-h-screen overflow-hidden'>
        <div className='absolute inset-0'>
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{ backgroundImage: "url('/images/home-hero-a.png')" }}
          />
          <div className='absolute inset-0 bg-[linear-gradient(90deg,rgba(10,8,7,0.82)_0%,rgba(10,8,7,0.55)_36%,rgba(10,8,7,0.18)_58%,rgba(10,8,7,0.10)_100%)]' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.14),transparent_30%)]' />
          <div className='absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(246,241,232,0)_0%,rgba(246,241,232,0.96)_100%)]' />
        </div>

        <div className='relative z-10 hidden md:block'>
          <SiteHeader
            theme='dark'
            ctaLabel='Get Started'
            ctaHref='/create-pet'
          />
        </div>

        <main className='relative z-10'>
          <section className='container-shell flex min-h-[calc(100vh-96px)] items-center py-10 md:py-16'>
            <div className='grid w-full items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]'>
              <div className='max-w-[640px]'>
                <div className='inline-flex items-center rounded-full border border-white/20 bg-white/8 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.22em] text-[#ffd089] shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm'>
                  Every memory, every bark, forever.
                </div>

                <h1 className='mt-6 text-[clamp(3.2rem,8vw,6rem)] font-black leading-[0.9] tracking-[-0.07em] text-white'>
                  Your pet.
                  <br />
                  <span className='inline-block whitespace-nowrap'>
                    <span className='text-[#ffbf1f]'>Forever</span> by your side.
                  </span>
                </h1>

                <p className='mt-6 max-w-[560px] text-[1rem] leading-[1.95] text-white/84 md:text-[1.04rem]'>
                  EchoPaws creates an AI companion inspired by your beloved pet —
                  warm conversations, long-term memory, emotional connection, and a
                  comforting presence that always feels close to you.
                </p>

                <div className='mt-8 flex flex-wrap gap-3'>
                  <Link
                    href='/create-pet'
                    className='inline-flex min-h-[50px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffb020_0%,#f97316_100%)] px-6 py-3 text-[0.96rem] font-extrabold text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition hover:brightness-105'
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
                  {featurePoints.map((item) => (
                    <div key={item} className='inline-flex items-center gap-2'>
                      <span className='text-white'>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className='hidden lg:block' />
            </div>
          </section>
        </main>
      </div>

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
              Whether you are missing a beloved pet or want to create a deeply
              emotional AI companion, EchoPaws brings together warmth,
              continuity, and memory in one comforting experience.
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

                <p className='mt-3 text-sm leading-7 text-slate-600'>
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

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
              We believe memory can be warm, interactive, and lasting. EchoPaws
              is designed to preserve affection, personality, and the comforting
              feeling of connection — so the bond you built never has to fade.
            </p>
          </div>
        </div>
      </section>

      <section className='bg-[#f7f2e8] py-16 text-slate-900 md:py-20'>
        <div className='container-shell'>
          <div className='mx-auto max-w-4xl rounded-[34px] border border-white/55 bg-white px-8 py-12 text-center shadow-[0_20px_48px_rgba(15,23,42,0.08)] backdrop-blur-md md:px-10'>
            <div className='mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl shadow-sm'>
              🐾
            </div>

            <h2 className='mt-5 text-[clamp(2rem,4vw,3.2rem)] font-black leading-[1.05] tracking-[-0.05em] text-slate-900'>
              Ready to meet your pet again?
            </h2>

            <p className='mx-auto mt-5 max-w-2xl text-[1rem] leading-[1.9] text-slate-600'>
              Create your AI pet in minutes. Set a name, a breed, a
              personality, and start a comforting conversation that feels like
              home.
            </p>

            <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
              <Link href='/create-pet' className='brand-button'>
                Create My Pet — Free
              </Link>

              <Link href='/chat' className='subtle-button'>
                Try a Chat First
              </Link>
            </div>

            <p className='mt-5 text-xs leading-6 text-slate-400'>
              No credit card required · Free plan includes 20 chats · Upgrade
              anytime
            </p>
          </div>
        </div>
      </section>

      <SiteFooter theme='light' />
    </div>
  );
}
