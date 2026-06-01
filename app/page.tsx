import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

const HERO_IMAGE_URL =
  'https://www.genspark.ai/api/files/s/zTEkSepx?cache_control=3600';

export default function HomePage() {
  return (
    <div className='min-h-screen bg-[#f8f5ef] text-slate-900'>
      {/* ── Desktop Header ── */}
      <div className='hidden md:block'>
        <SiteHeader />
      </div>

      <main className='flex-1'>
        {/* ── Hero ── */}
        <section className='relative overflow-hidden'>
          {/* Background image + overlay */}
          <div
            className='absolute inset-0 bg-cover bg-center bg-no-repeat'
            style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
            aria-hidden='true'
          />
          {/* Dark gradient overlay – left heavy so text is always readable */}
          <div
            className='absolute inset-0'
            style={{
              background:
                'linear-gradient(110deg, rgba(10,8,6,0.75) 0%, rgba(10,8,6,0.52) 45%, rgba(10,8,6,0.18) 100%)',
            }}
            aria-hidden='true'
          />

          {/* Hero content */}
          <div className='container-shell relative z-10 py-20 md:py-28 lg:py-36'>
            <div className='max-w-2xl'>
              {/* Eyebrow badge */}
              <div className='inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/15 px-4 py-1.5 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-orange-300 backdrop-blur-sm'>
                🐾 Emotional AI Companion
              </div>

              {/* Headline */}
              <h1 className='mt-5 text-[clamp(2.4rem,5.5vw,4rem)] font-black leading-[1.04] tracking-[-0.04em] text-white'>
                Your pet.{' '}
                <span className='text-amber-400'>Forever</span> by your side.
              </h1>

              {/* Subtitle */}
              <p className='mt-5 max-w-xl text-[1.06rem] leading-[1.8] text-white/75'>
                EchoPaws helps pet lovers create a comforting AI companion
                inspired by their beloved pets. Through memories, conversations,
                and emotional connection, every interaction feels warm,
                personal, and familiar.
              </p>

              {/* CTAs */}
              <div className='mt-8 flex flex-wrap gap-4'>
                <Link href='/create-pet' className='brand-button shadow-xl shadow-orange-600/30'>
                  Create My Pet
                </Link>
                <Link
                  href='/chat'
                  className='inline-flex min-h-[48px] items-center justify-content gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-0 text-[0.95rem] font-bold text-white backdrop-blur-sm transition hover:bg-white/18'
                >
                  Try AI Chat
                </Link>
              </div>

              {/* Trust tags */}
              <div className='mt-7 flex flex-wrap gap-5 text-sm font-semibold text-white/55'>
                <span>✓ Google & Email Login</span>
                <span>✓ Emotional AI Chat</span>
                <span>✓ Long-Term Memory</span>
              </div>
            </div>
          </div>

          {/* Floating pet-online badge */}
          <div className='absolute bottom-6 right-6 z-10 hidden items-center gap-3 rounded-[18px] border border-white/18 bg-white/10 px-4 py-3 backdrop-blur-md md:flex'>
            <div className='grid h-10 w-10 place-items-center rounded-[12px] bg-gradient-to-br from-amber-300 to-orange-400 text-xl shadow-md'>
              🐶
            </div>
            <div>
              <div className='text-sm font-extrabold text-white'>Your pet is ready</div>
              <div className='mt-0.5 text-[0.72rem] text-white/60'>
                Start chatting in seconds
              </div>
            </div>
            <span className='ml-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,0.25)]' />
          </div>
        </section>

        {/* ── Why EchoPaws ── */}
        <section className='bg-[#f8f5ef] py-14 md:py-20'>
          <div className='container-shell'>
            <div className='eyebrow text-center'>Why EchoPaws</div>

            <h2 className='mt-4 text-center text-[clamp(1.6rem,3vw,2.5rem)] font-black leading-tight tracking-[-0.03em] text-slate-900'>
              More than a memory. A companion that{' '}
              <span className='text-orange-500'>feels alive.</span>
            </h2>

            <p className='mx-auto mt-4 max-w-2xl text-center text-base leading-[1.85] text-slate-500'>
              Whether you are missing a beloved pet or want to create an
              emotional AI companion, EchoPaws gives you warmth, memory, and
              presence — anytime.
            </p>

            <div className='mt-10 grid gap-5 md:grid-cols-3'>
              {[
                {
                  icon: '💬',
                  title: 'Emotional AI Chat',
                  desc: 'Every conversation is warm and personal. Your AI pet responds with the personality, habits, and quirks you gave it — just like the real thing.',
                },
                {
                  icon: '🧠',
                  title: 'Long-Term Memory',
                  desc: 'EchoPaws remembers your stories, your mood, and your bond over time. The more you chat, the deeper the connection grows.',
                },
                {
                  icon: '❤️',
                  title: 'Always by Your Side',
                  desc: 'No schedules, no goodbyes. Your companion is there whenever you need comfort, conversation, or just a familiar presence.',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className='glass-card p-7 text-center transition hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100/60'
                >
                  <div className='mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-orange-50 to-amber-100 text-3xl shadow-sm'>
                    {f.icon}
                  </div>
                  <h3 className='mt-5 text-lg font-extrabold text-slate-900'>{f.title}</h3>
                  <p className='mt-3 text-sm leading-[1.85] text-slate-500'>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social Proof + Final CTA ── */}
        <section className='bg-gradient-to-br from-orange-50 to-amber-50 py-14 md:py-20'>
          <div className='container-shell'>
            {/* Stats */}
            <div className='grid grid-cols-3 gap-6 md:gap-10'>
              {[
                { num: '10K+', label: 'Pet Lovers Joined' },
                { num: '50K+', label: 'Memories Stored' },
                { num: '4.9 ★', label: 'Average Rating' },
              ].map((s) => (
                <div key={s.label} className='text-center'>
                  <div className='text-[clamp(1.8rem,4vw,3rem)] font-black tracking-[-0.04em] text-orange-600'>
                    {s.num}
                  </div>
                  <div className='mt-1 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-orange-900/70'>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Final CTA block */}
            <div className='mt-14 rounded-[32px] border border-orange-200 bg-white/70 p-8 text-center shadow-sm backdrop-blur-sm md:p-12'>
              <div className='text-4xl'>🐾</div>
              <h2 className='mt-4 text-[clamp(1.6rem,3vw,2.4rem)] font-black tracking-[-0.03em] text-slate-900'>
                Ready to meet your pet again?
              </h2>
              <p className='mx-auto mt-4 max-w-xl text-base leading-[1.85] text-slate-500'>
                It only takes a minute to create your AI pet. Set a name, a
                breed, a personality — and start a conversation that feels just
                like coming home.
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
                No credit card required · Free plan includes {20} chats · Upgrade anytime
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter text='© 2026 EchoPaws.ai. All Rights Reserved.' />
    </div>
  );
}
