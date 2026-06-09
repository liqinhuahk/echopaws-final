import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { findSubscriptionByUserId } from '@/lib/subscriptions';

const FREE_TOTAL_CHAT_LIMIT = 20;
const FREE_TIER_MAX_PETS = 2;
const VIP_PRICE = '$9.99';
const ACTIVE_VIP_STATUSES = ['active', 'trialing', 'past_due'];

const comparisonRows = [
  ['Price', '$0 forever', '$9.99 / month'],
  ['Chats', `${FREE_TOTAL_CHAT_LIMIT} lifetime chats`, 'Unlimited chats'],
  ['Pet capacity', `Up to ${FREE_TIER_MAX_PETS} pets`, `More than ${FREE_TIER_MAX_PETS} pets`],
  ['Memory', 'Basic memory capability', 'Deeper long-term memory'],
  ['Emotional continuity', 'Basic continuity', 'Richer emotional continuity'],
  ['Voice features', 'Future basic access', 'Priority future access'],
  ['Best for', 'Trying EchoPaws gently', 'Users who want deeper companionship'],
];

const faqs = [
  {
    q: 'Can I cancel VIP anytime?',
    a: 'Yes. You can manage or cancel your membership through the billing portal.',
  },
  {
    q: 'Do Free chats reset every day?',
    a: 'No. Free includes 20 total lifetime chats across your account, not a daily reset.',
  },
  {
    q: 'What happens to my pets after canceling VIP?',
    a: 'Your data remains in your account. Future pet capacity and premium behavior depend on your current plan status.',
  },
  {
    q: 'Is VIP mainly about message count?',
    a: 'No. VIP is designed for deeper continuity, stronger memory, and more room for long-term companionship.',
  },
];

export default async function PricingPage() {
  let vipActive = false;
  let signedIn = false;

  if (hasSupabaseEnv()) {
    try {
      const supabase = createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      signedIn = !!user;

      if (user) {
        const subscription = await findSubscriptionByUserId(user.id);
        vipActive =
          subscription?.plan === 'vip' &&
          ACTIVE_VIP_STATUSES.includes(subscription.status ?? '');
      }
    } catch {
      vipActive = false;
      signedIn = false;
    }
  }

  return (
    <div className='app-brand-backdrop'>
      <SiteHeader
        theme='dark'
        ctaLabel={vipActive ? 'Manage Membership' : 'Get Started'}
        ctaHref={vipActive ? '/account' : '/create-pet'}
      />

      <main className='container-shell py-8 md:py-10'>
        <section className='glass-card p-6 md:p-8'>
          <div className='eyebrow'>✦ Membership</div>

          <h1 className='page-title mt-5 max-w-4xl text-[clamp(2.5rem,5vw,4.6rem)]'>
            Pricing designed for deeper companionship
          </h1>

          <p className='mt-5 max-w-4xl text-[1rem] leading-[1.95] text-[rgba(255,244,230,0.78)]'>
            Start free, then upgrade only when the bond feels real. EchoPaws VIP is not about
            counting messages — it is about preserving continuity, emotional memory, and a
            companion that keeps growing with you.
          </p>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-2'>
          <article className='glass-card p-6'>
            <div className='eyebrow'>Free plan</div>
            <h2 className='section-title mt-4 text-2xl'>Free</h2>

            <div className='mt-4 flex items-end gap-1'>
              <strong className='text-4xl font-extrabold tracking-[-0.05em] text-[color:#fff7ed]'>$0</strong>
              <span className='mb-1 text-sm font-semibold text-[rgba(255,244,230,0.56)]'>/ forever</span>
            </div>

            <p className='mt-4 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
              A gentle starting point for first-time users who want to explore EchoPaws before
              upgrading.
            </p>

            <ul className='mt-5 grid gap-3 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
              <li>✓ {FREE_TOTAL_CHAT_LIMIT} lifetime chats</li>
              <li>✓ Up to {FREE_TIER_MAX_PETS} pets</li>
              <li>✓ Basic memory capability</li>
              <li>✓ Pet profile and photo upload</li>
            </ul>

            <div className='mt-6'>
              <Link href={signedIn ? '/create-pet' : '/login'} className='subtle-button w-full'>
                {signedIn ? 'Continue with Free' : 'Sign in to start'}
              </Link>
            </div>
          </article>

          <article className='glass-card p-6'>
            <div className='flex items-center justify-between gap-3'>
              <div className='eyebrow'>VIP membership</div>
              <span className='tag-chip tag-chip--warm'>Recommended</span>
            </div>

            <h2 className='section-title mt-4 text-2xl'>VIP</h2>

            <div className='mt-4 flex items-end gap-1'>
              <strong className='text-4xl font-extrabold tracking-[-0.05em] text-[color:#fff7ed]'>
                {VIP_PRICE}
              </strong>
              <span className='mb-1 text-sm font-semibold text-[rgba(255,244,230,0.56)]'>/ month</span>
            </div>

            <p className='mt-4 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
              Best for users who want uninterrupted companionship, deeper memory, and more pet
              capacity.
            </p>

            <ul className='mt-5 grid gap-3 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
              <li>✓ Unlimited chats</li>
              <li>✓ More than {FREE_TIER_MAX_PETS} pets</li>
              <li>✓ Deeper long-term memory</li>
              <li>✓ Richer emotional continuity</li>
              <li>✓ Priority access to future voice features</li>
            </ul>

            <div className='mt-6'>
              <Link
                href={vipActive ? '/account' : signedIn ? '/account' : '/login'}
                className='brand-button w-full'
              >
                {vipActive ? 'Manage Membership' : 'Upgrade to VIP'}
              </Link>
            </div>
          </article>
        </section>

        <section className='mt-8 glass-card p-6'>
          <h2 className='section-title text-2xl'>Plan comparison</h2>

          <div className='mt-5 overflow-hidden rounded-[24px] border border-white/8'>
            <div className='grid grid-cols-3 bg-white/4 px-4 py-3 text-sm font-bold text-[rgba(255,244,230,0.82)]'>
              <div>Feature</div>
              <div>Free</div>
              <div>VIP</div>
            </div>

            {comparisonRows.map(([label, free, vip]) => (
              <div
                key={label}
                className='grid grid-cols-3 border-t border-white/8 px-4 py-4 text-sm leading-7 text-[rgba(255,244,230,0.78)]'
              >
                <div className='font-semibold text-[color:#fff7ed]'>{label}</div>
                <div>{free}</div>
                <div>{vip}</div>
              </div>
            ))}
          </div>
        </section>

        <section className='mt-8 glass-card p-6'>
          <h2 className='section-title text-2xl'>Frequently asked questions</h2>

          <div className='mt-5 grid gap-4 md:grid-cols-2'>
            {faqs.map((item) => (
              <article key={item.q} className='dark-shell-panel p-5'>
                <h3 className='text-base font-extrabold text-[color:#fff7ed]'>{item.q}</h3>
                <p className='mt-2 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter text='© 2026 EchoPaws.ai. All Rights Reserved.' />
    </div>
  );
}
