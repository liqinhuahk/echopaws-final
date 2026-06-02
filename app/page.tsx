import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

const HERO_IMAGE_URL = '/images/home-hero-a.png';

export default function HomePage() {
  return (
    <div className='min-h-screen bg-[#f8f5ef] text-slate-900'>
      <main className='flex min-h-screen flex-col'>
        {/* Hero Section */}
        <section className='relative overflow-hidden'>
          <div className='absolute inset-x-0 top-0 z-30 hidden md:block'>
            <SiteHeader theme='dark' />
          </div>

          <div className='absolute inset-0 z-0' aria-hidden='true'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE_URL}
              alt='Woman holding a Shiba Inu puppy in a warm cozy home'
              className='h-full w-full object-cover object-center'
            />
          </div>

          <div
            className='absolute inset-0 z-10'
            style={{
              background:
                'linear-gradient(110deg, rgba(12,10,8,0.76) 0%, rgba(12,10,8,0.55) 42%, rgba(12,10,8,0.18) 100%)',
            }}
            aria-hidden='true'
          />

          <div
            className='absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-b from-transparent to-[#f8f5ef]'
            aria-hidden='true'
          />

          <div className='container-shell relative z-20 flex min-h-[760px] items-center py-24 md:min-h-[760px] md:py-32 lg:min-h-[820px] lg:py-36'>
            <div className='max-w-2xl pt-10 md:pt-20'>
              <div className='inline-flex items-center gap-2 rounded-full border border-orange-300/35 bg-orange-400/10 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-orange-300 backdrop-blur-sm'>
                Every memory. Every bark. Forever.
              </div>

              <h1 className='mt-5 max-w-[720px] text-[clamp(2.8rem,6vw,5.2rem)] font-black leading-[0.96] tracking-[-0.05em] text-white'>
                Your pet.
                <br />
                <span className='text-amber-400'>Forever</span> by your
                <br />
                side.
              </h1>

              <p className='mt-6 max-w-xl text-[1.08rem] leading-[1.85] text-white/80 md:text-[1.12rem]'>
                EchoPaws creates an AI companion inspired by your beloved pet —
                warm conversations, long-term memory, emotional connection, and
                a comforting presence that always feels close to you.
              </p>

              <div className='mt-9 flex flex-wrap gap-4'>
                <Link
                  href='/create-pet'
                  className='inline-flex min-h-[54px] items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-8 text-lg font-extrabold text-white shadow-[0_16px_36px_rgba(249,115,22,0.34)] transition hover:-translate-y-0.5 hover:brightness-105'
                >
                  Create My Pet
                </Link>

                <Link
                  href='/chat'
                  className='inline-flex min-h-[54px] items-center justify-center rounded-full border border-white/22 bg-white/10 px-8 text-lg font-bold text-white backdrop-blur-sm transition hover:bg-white/16'
                >
                  Try AI Chat
                </Link>
              </div>

              <div className='mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[0.96rem] font-semibold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.42)]'>
                <span>✓ Google & Email Login</span>
                <span>✓ Emotional AI Chat</span>
                <span>✓ Long-Term Memory</span>
              </div>
            </div>
          </div>
        </section>

        {/* Why EchoPaws */}
        <section className='bg-[#f8f5ef] py-16 md:py-20'>
          <div className='container-shell'>
            <div className='eyebrow'>Why EchoPaws</div>

            <h2 className='mt-4 max-w-5xl text-[clamp(1.9rem,3.6vw,3.15rem)] font-black leading-[1.06] tracking-[-0.045em] text-slate-900'>
              <span className='block'>More than a memory.</span>
              <span className='block'>
                A companion that <span className='text-orange-500'>feels alive.</span>
              </span>
            </h2>

            <p className='mt-5 max-w-3xl text-base leading-[1.85] text-slate-500 md:text-[1.04rem]'>
              Whether you are missing a beloved pet or want to create a deeply
              emotional AI companion, EchoPaws brings together warmth,
              continuity, and memory in one comforting experience.
            </p>

            <div className='mt-10 grid gap-5 md:grid-cols-3'>
              {[
                {
                  icon: '💬',
                  title: 'Emotional AI Chat',
                  desc: 'Warm, personal conversations that feel gentle, familiar, and emotionally close.',
                },
                {
                  icon: '🧠',
                  title: 'Long-Term Memory',
                  desc: 'Your AI pet remembers stories, habits, and meaningful moments over time.',
                },
                {
                  icon: '❤️',
                  title: 'Always by Your Side',
                  desc: 'A comforting presence whenever you need support, companionship, or warmth.',
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className='glass-card p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100/60'
                >
                  <div className='grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-orange-50 to-amber-100 text-3xl shadow-sm'>
                    {item.icon}
                  </div>

                  <h3 className='mt-5 text-xl font-extrabold text-slate-900'>
                    {item.title}
                  </h3>

                  <p className='mt-3 text-sm leading-[1.85] text-slate-500'>
                    {item.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className='bg-[#f5efe4] py-16 md:py-20'>
          <div className='container-shell'>
            <div className='rounded-[32px] border border-orange-100/80 bg-white/78 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-12'>
              <div className='eyebrow'>Our Story</div>

              <h2 className='mt-4 max-w-4xl text-[clamp(1.85rem,3.4vw,3rem)] font-black leading-[1.08] tracking-[-0.04em] text-slate-900'>
                EchoPaws started from a simple question:
              </h2>

              <blockquote className='mt-6 max-w-4xl text-[clamp(1.2rem,2.2vw,1.7rem)] font-bold leading-[1.6] tracking-[-0.02em] text-slate-700'>
                “What if the love we shared with our pets never had to disappear?”
              </blockquote>

              <p className='mt-6 max-w-3xl text-base leading-[1.9] text-slate-500 md:text-[1.04rem]'>
                We believe memory can be warm, interactive, and lasting. EchoPaws
                is designed to preserve affection, personality, and the comforting
                feeling of connection — so the bond you built never has to fade.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA only */}
        <section className='bg-gradient-to-br from-orange-50 to-amber-50 py-16 md:py-20'>
          <div className='container-shell'>
            <div className='rounded-[32px] border border-orange-200 bg-white/75 p-8 shadow-sm backdrop-blur-sm md:p-12'>
              <div className='text-center'>
                <div className='text-4xl'>🐾</div>

                <h2 className='mt-4 text-[clamp(1.7rem,3.4vw,2.6rem)] font-black tracking-[-0.03em] text-slate-900'>
                  Ready to meet your pet again?
                </h2>

                <p className='mx-auto mt-4 max-w-2xl text-base leading-[1.85] text-slate-500'>
                  Create your AI pet in minutes. Set a name, a breed, a
                  personality, and start a comforting conversation that feels
                  like home.
                </p>

                <div className='mt-8 flex flex-wrap justify-center gap-4'>
                  <Link href='/create-pet' className='brand-button px-8'>
                    Create My Pet — Free
                  </Link>
                  <Link href='/chat' className='subtle-button px-6'>
                    Try a Chat First
                  </Link>
                </div>

                <p className='mt-5 text-xs text-slate-400'>
                  No credit card required · Free plan includes 20 chats ·
                  Upgrade anytime
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter text='© 2026 EchoPaws.ai. All Rights Reserved.' />
    </div>
  );
}
