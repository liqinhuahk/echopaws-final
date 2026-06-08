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
    title: 'Emotion-first conversations',
    description:
      'A warmer chat experience designed to feel emotionally present, gentle, and ongoing.',
  },
  {
    icon: '🧠',
    title: 'Memory that grows over time',
    description:
      'EchoPaws keeps meaningful details so your companion can remember preferences, habits, and moments.',
  },
  {
    icon: '❤️',
    title: 'A softer digital companion',
    description:
      'Built for comfort, continuity, and a bond that feels calmer than ordinary chatbot experiences.',
  },
];

export default function HomePage() {
  return (
    <div className='app-brand-backdrop'>
      <SiteHeader theme='dark' ctaLabel='Get Started' ctaHref='/create-pet' />

      <main className='container-shell py-8 md:py-10'>
        <section className='grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center'>
          <div className='space-y-6'>
            <div className='eyebrow'>✦ Welcome to EchoPaws</div>

            <div className='max-w-[700px]'>
              <h1 className='page-title text-[clamp(3.1rem,8vw,6.4rem)] leading-[0.92]'>
                Your warm
                <br />
                <span className='bg-gradient-to-r from-amber-300 via-orange-400 to-orange-500 bg-clip-text text-transparent'>
                  AI companion
                </span>
                <br />
                for everyday comfort.
              </h1>

              <p className='page-subtitle mt-6 max-w-[620px] text-[1.02rem] leading-[1.95]'>
                Build a companion that chats with emotional warmth, remembers what matters, and
                grows with your shared moments over time.
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link href='/create-pet' className='brand-button'>
                Create Your Pet
              </Link>
              <Link href='/chat' className='subtle-button'>
                Try the Chat
              </Link>
            </div>

            <div className='flex flex-wrap gap-2 pt-2'>
              {featurePoints.map((point) => (
                <span key={point} className='tag-chip tag-chip--soft'>
                  {point}
                </span>
              ))}
            </div>
          </div>

          <section className='glass-card p-6 md:p-8'>
            <div className='eyebrow'>A calmer companion experience</div>

            <h2 className='section-title mt-5 text-[clamp(1.9rem,3vw,2.8rem)]'>
              More warmth, less noise
            </h2>

            <p className='mt-4 text-[0.98rem] leading-[1.9] text-body'>
              EchoPaws is designed to feel softer than a typical assistant: emotionally grounded,
              visually calm, and built for companionship rather than utility alone.
            </p>

            <div className='mt-6 grid gap-4'>
              <div className='dark-shell-panel p-5'>
                <div className='text-sm font-extrabold uppercase tracking-[0.12em] text-amber-300'>
                  Warm presence
                </div>
                <p className='mt-2 text-sm leading-7 text-body'>
                  A dark, quiet shell with gentle amber highlights keeps the product feeling intimate
                  and emotionally close.
                </p>
              </div>

              <div className='dark-shell-panel p-5'>
                <div className='text-sm font-extrabold uppercase tracking-[0.12em] text-amber-300'>
                  Long-term memory
                </div>
                <p className='mt-2 text-sm leading-7 text-body'>
                  Your companion can remember habits, favorite things, emotional signals, and shared
                  stories over time.
                </p>
              </div>

              <div className='dark-shell-panel p-5'>
                <div className='text-sm font-extrabold uppercase tracking-[0.12em] text-amber-300'>
                  Gentle continuity
                </div>
                <p className='mt-2 text-sm leading-7 text-body'>
                  Move naturally from Home to Login, Chat, Memories, Account, and Pricing without
                  breaking the visual mood.
                </p>
              </div>
            </div>
          </section>
        </section>

        <section className='mt-10'>
          <div className='mb-5'>
            <div className='eyebrow'>Why EchoPaws</div>
            <h2 className='section-title mt-4 text-[clamp(2rem,3.5vw,3rem)]'>
              Built for softer companionship
            </h2>
            <p className='mt-3 max-w-3xl text-[0.98rem] leading-[1.9] text-body'>
              The goal is not just chatting. It is a consistent emotional space where memory,
              warmth, and continuity make your companion feel more personal over time.
            </p>
          </div>

          <div className='grid gap-5 md:grid-cols-3'>
            {whyCards.map((card) => (
              <article key={card.title} className='glass-card p-6'>
                <div className='text-3xl'>{card.icon}</div>
                <h3 className='mt-4 text-xl font-extrabold text-strong'>{card.title}</h3>
                <p className='mt-3 text-sm leading-7 text-body'>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className='mt-10 grid gap-5 lg:grid-cols-[1.1fr_.9fr]'>
          <article className='glass-card p-6 md:p-8'>
            <div className='eyebrow'>Our story</div>
            <h2 className='section-title mt-4 text-[clamp(2rem,3vw,2.8rem)]'>
              A gentler interface for emotional connection
            </h2>
            <p className='mt-4 text-[0.98rem] leading-[1.95] text-body'>
              EchoPaws was shaped around the idea that digital companionship should feel calmer,
              warmer, and more emotionally coherent. Instead of sharp, sterile UI patterns, the
              experience leans into deep shadow, soft highlights, and emotionally reassuring space.
            </p>
            <p className='mt-4 text-[0.98rem] leading-[1.95] text-body'>
              The result is a companion journey that moves naturally from sign-in to daily chat,
              memory review, pet management, and membership — all inside one continuous atmosphere.
            </p>
          </article>

          <article className='glass-card p-6 md:p-8'>
            <div className='eyebrow'>Start in minutes</div>
            <ul className='mt-5 grid gap-4 text-sm leading-7 text-body'>
              <li className='dark-shell-panel p-4'>
                <span className='font-bold text-strong'>1.</span> Sign in with Google or email.
              </li>
              <li className='dark-shell-panel p-4'>
                <span className='font-bold text-strong'>2.</span> Create your first AI pet profile.
              </li>
              <li className='dark-shell-panel p-4'>
                <span className='font-bold text-strong'>3.</span> Start chatting and let memories
                build over time.
              </li>
            </ul>
          </article>
        </section>

        <section className='mt-10 glass-card p-6 md:p-8'>
          <div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
            <div>
              <div className='eyebrow'>Ready to begin</div>
              <h2 className='section-title mt-4 text-[clamp(2rem,3vw,3rem)]'>
                Create your first companion
              </h2>
              <p className='mt-3 max-w-2xl text-[0.98rem] leading-[1.9] text-body'>
                Start free, shape your pet’s personality, and begin building a more emotionally
                connected chat experience.
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link href='/create-pet' className='brand-button'>
                Create Pet
              </Link>
              <Link href='/pricing' className='subtle-button'>
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter text='© 2026 EchoPaws.ai. All Rights Reserved.' />
    </div>
  );
}
