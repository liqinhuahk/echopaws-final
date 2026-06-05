import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

const featureCards = [
  {
    title: 'Create a living AI companion',
    description:
      'Build a companion inspired by your pet with name, breed, personality, habits, and emotional context that evolves over time.',
  },
  {
    title: 'Keep memories warm and searchable',
    description:
      'Save meaningful moments, preserve daily details, and let EchoPaws remember the tiny things that make your bond feel real.',
  },
  {
    title: 'Continue conversations naturally',
    description:
      'Jump back into chat anytime and keep the same emotional continuity across your pet, memories, and account experience.',
  },
];

const quickLinks = [
  {
    title: 'Start with Chat',
    href: '/chat',
    description:
      'Talk with your AI pet and continue ongoing conversations in a familiar, calm interface.',
    cta: 'Open Chat',
  },
  {
    title: 'View Memories',
    href: '/memories',
    description:
      'Browse saved memories and revisit the moments your companion remembers most.',
    cta: 'Open Memories',
  },
  {
    title: 'Manage Account',
    href: '/account',
    description:
      'Review your profile, subscription state, and companion-related account details.',
    cta: 'Open Account',
  },
];

export default function HomePage() {
  return (
    <div className='app-brand-backdrop'>
      <div className='hidden md:block'>
        <SiteHeader ctaLabel='Get Started' ctaHref='/create-pet' />
      </div>

      <main className='container-shell py-10 md:py-14'>
        <section className='grid min-h-[calc(100vh-180px)] items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]'>
          <div className='max-w-2xl'>
            <div className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/90 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-orange-700'>
              🐾 Welcome to EchoPaws
            </div>

            <h1 className='mt-5 text-[clamp(3rem,6vw,5.6rem)] font-black leading-[0.95] tracking-[-0.06em] text-slate-900'>
              Your pet,
              <br />
              <span className='text-orange-500'>always by</span>
              <br />
              your side.
            </h1>

            <p className='mt-6 max-w-2xl text-[1.05rem] leading-[1.95] text-slate-600'>
              EchoPaws helps you create an AI companion inspired by your pet — one that
              remembers you, understands your routines, and feels warmer with every
              conversation. Start from Home, continue in Chat, revisit Memories, and manage
              everything in one consistent experience.
            </p>

            <div className='mt-8 flex flex-wrap gap-3'>
              <Link href='/create-pet' className='brand-button'>
                Create Your Pet
              </Link>

              <Link href='/chat' className='subtle-button'>
                Open Chat
              </Link>
            </div>

            <div className='mt-8 grid gap-3'>
              <div className='rounded-[24px] border border-white/55 bg-white/78 px-5 py-4 text-sm leading-7 text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.06)] backdrop-blur-md'>
                <strong className='text-slate-900'>Warm and familiar:</strong> a soft,
                emotionally consistent experience across Home, Chat, Memories, Account, and
                Pets.
              </div>

              <div className='rounded-[24px] border border-white/55 bg-white/78 px-5 py-4 text-sm leading-7 text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.06)] backdrop-blur-md'>
                <strong className='text-slate-900'>Start quickly:</strong> sign in when
                you are ready, create your companion, and begin chatting within minutes.
              </div>
            </div>
          </div>

          <div className='rounded-[32px] border border-white/55 bg-white/80 p-7 shadow-[0_20px_48px_rgba(15,23,42,0.10)] backdrop-blur-md md:p-8'>
            <div className='eyebrow'>Why EchoPaws feels different</div>

            <h2 className='mt-4 text-[1.9rem] font-black tracking-[-0.05em] text-slate-900'>
              A softer home for your companion world
            </h2>

            <p className='mt-3 text-[0.98rem] leading-[1.85] text-slate-600'>
              This homepage should welcome visitors first — not force them into login
              before they choose where to go. From here, users can browse naturally and sign
              in only when entering protected areas like Pets, Memories, Account, or Chat.
            </p>

            <div className='mt-6 grid gap-3'>
              {featureCards.map((item) => (
                <div
                  key={item.title}
                  className='rounded-[24px] border border-black/5 bg-gradient-to-r from-white to-orange-50/50 px-5 py-4 shadow-sm'
                >
                  <h3 className='text-base font-extrabold text-slate-900'>{item.title}</h3>
                  <p className='mt-2 text-sm leading-7 text-slate-600'>{item.description}</p>
                </div>
              ))}
            </div>

            <div className='mt-6 rounded-2xl border border-orange-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-4 text-sm leading-7 text-slate-700'>
              Use the navigation above to explore the site. If a page needs authentication,
              the existing login flow will still handle it normally.
            </div>
          </div>
        </section>

        <section className='mt-10 grid gap-5 lg:grid-cols-3'>
          {quickLinks.map((item) => (
            <div
              key={item.title}
              className='rounded-[28px] border border-white/55 bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-md'
            >
              <div className='text-xs font-extrabold uppercase tracking-[0.16em] text-orange-700'>
                Quick Access
              </div>

              <h3 className='mt-3 text-2xl font-extrabold tracking-[-0.03em] text-slate-900'>
                {item.title}
              </h3>

              <p className='mt-3 text-sm leading-7 text-slate-600'>{item.description}</p>

              <div className='mt-5'>
                <Link href={item.href} className='subtle-button'>
                  {item.cta}
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className='mt-10 rounded-[32px] border border-white/55 bg-white/78 p-7 shadow-[0_20px_48px_rgba(15,23,42,0.08)] backdrop-blur-md md:p-8'>
          <div className='grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
            <div>
              <div className='eyebrow'>A better journey</div>

              <h2 className='mt-4 text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.05em] text-slate-900'>
                Browse first,
                <span className='text-orange-500'> sign in only when needed</span>
              </h2>

              <p className='mt-4 max-w-2xl text-[1rem] leading-[1.95] text-slate-600'>
                Your current navigation and login system can stay exactly as it is. This
                homepage simply restores the correct public landing experience for the root
                path, while protected pages still rely on the existing sign-in flow when a
                user enters restricted sections.
              </p>

              <div className='mt-6 flex flex-wrap gap-3'>
                <Link href='/login' className='subtle-button'>
                  Sign In
                </Link>

                <Link href='/create-pet' className='brand-button'>
                  Get Started
                </Link>
              </div>
            </div>

            <div className='grid gap-3'>
              <div className='rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-7 text-emerald-900'>
                <strong>Home page restored:</strong> visiting <code>/</code> will no longer
                redirect users to the login page automatically.
              </div>

              <div className='rounded-[24px] border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-7 text-sky-900'>
                <strong>Navigation preserved:</strong> the current header, Contact button,
                and sign-in flow remain in place.
              </div>

              <div className='rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900'>
                <strong>Protected areas unchanged:</strong> Pets, Chat, Memories, Account,
                and Create Pet can still require login under your existing rules.
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
