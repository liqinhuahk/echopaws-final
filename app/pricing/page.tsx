import Link from 'next/link';
import { createVipCheckoutSession, openBillingPortal } from '@/app/actions/billing';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { findSubscriptionByUserId } from '@/lib/subscriptions';

const FREE_TOTAL_CHAT_LIMIT = 20;
const FREE_TIER_MAX_PETS = 2;
const VIP_PRICE = '$9.99';

const ACTIVE_VIP_STATUSES = ['active', 'trialing', 'past_due'];

const comparisonRows = [
  {
    feature: 'Price',
    free: '$0 forever',
    vip: `${VIP_PRICE} / month`,
  },
  {
    feature: 'Chats',
    free: `${FREE_TOTAL_CHAT_LIMIT} lifetime chats`,
    vip: 'Unlimited chats',
  },
  {
    feature: 'Pet capacity',
    free: `Up to ${FREE_TIER_MAX_PETS} pets`,
    vip: `More than ${FREE_TIER_MAX_PETS} pets`,
  },
  {
    feature: 'Memory',
    free: 'Basic memory capability',
    vip: 'Deeper long-term memory',
  },
  {
    feature: 'Emotional continuity',
    free: 'Light companionship context',
    vip: 'Richer continuity and deeper emotional understanding',
  },
  {
    feature: 'Voice features',
    free: 'Not included',
    vip: 'Priority access to future voice features',
  },
  {
    feature: 'Best for',
    free: 'Trying EchoPaws for the first time',
    vip: 'Building a long-term emotional bond',
  },
];

const faqs = [
  {
    question: 'How do I pay for VIP?',
    answer:
      'VIP is billed monthly through Stripe. You can subscribe securely with the payment methods supported by Stripe in your region.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes. You can cancel from the billing portal at any time. Your VIP access will remain available until the end of the current billing period.',
  },
  {
    question: 'How many chats are included in the Free plan?',
    answer: `Free includes ${FREE_TOTAL_CHAT_LIMIT} lifetime chats shared across your account. These chats do not reset daily.`,
  },
  {
    question: 'How many pets can I create on Free?',
    answer: `Free supports up to ${FREE_TIER_MAX_PETS} pets. If you want more pet capacity, you can upgrade to VIP.`,
  },
  {
    question: 'What extra benefits does VIP unlock?',
    answer:
      'VIP unlocks unlimited chats, more pet capacity, deeper long-term memory, richer emotional continuity, and priority access to future voice features.',
  },
  {
    question: 'What happens to my data if I cancel VIP?',
    answer:
      'Your account and pets remain in your account. After cancellation, your plan returns to Free rules at the end of the paid period.',
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: { error?: string; billing?: string; checkout?: string };
}) {
  let isLoggedIn = false;
  let vipActive = false;

  if (hasSupabaseEnv()) {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    isLoggedIn = Boolean(user);

    if (user) {
      try {
        const subscription = await findSubscriptionByUserId(user.id);
        vipActive =
          subscription?.plan === 'vip' &&
          ACTIVE_VIP_STATUSES.includes(subscription.status);
      } catch {
        vipActive = false;
      }
    }
  }

  return (
    <>
      <SiteHeader
        ctaLabel={vipActive ? 'Manage Membership' : 'Upgrade to VIP'}
        ctaHref={vipActive ? '/account' : '#plans'}
      />

      <main className='container-shell py-10'>
        <section className='text-center'>
          <div className='eyebrow'>Membership</div>
          <h1 className='page-title mt-4'>
            Pricing designed for deeper companionship
          </h1>
          <p className='section-subtitle mx-auto max-w-3xl'>
            Start free, then upgrade only when the bond feels real. EchoPaws VIP
            is not about counting messages — it is about preserving continuity,
            emotional memory, and a companion that keeps growing with you.
          </p>
        </section>

        {searchParams?.error ? (
          <div className='mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
            {searchParams.error}
          </div>
        ) : null}

        {searchParams?.billing ? (
          <div className='mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900'>
            {searchParams.billing}
          </div>
        ) : null}

        {searchParams?.checkout === 'success' ? (
          <div className='mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
            Payment successful. Your VIP Membership is now active.
          </div>
        ) : null}

        {searchParams?.checkout === 'cancelled' ? (
          <div className='mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900'>
            Checkout was cancelled. You can upgrade to VIP anytime.
          </div>
        ) : null}

        <section id='plans' className='mt-8 grid gap-5 md:grid-cols-2'>
          <article className='glass-card p-6'>
            <div className='inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-stone-700'>
              Free Plan
            </div>

            <h2 className='mt-4 text-2xl font-extrabold'>Free</h2>

            <div className='mt-4 flex items-end gap-2'>
              <strong className='text-5xl font-extrabold tracking-[-0.05em]'>
                $0
              </strong>
              <span className='mb-1 text-muted'>/ forever</span>
            </div>

            <p className='mt-3 text-sm leading-8 text-muted'>
              A gentle starting point for first-time users who want to explore
              EchoPaws before upgrading.
            </p>

            <ul className='mt-5 grid gap-3 text-sm leading-7'>
              <li>✓ {FREE_TOTAL_CHAT_LIMIT} lifetime chats</li>
              <li>✓ Up to {FREE_TIER_MAX_PETS} pets</li>
              <li>✓ Basic memory capability</li>
              <li>✓ Pet profile and photo upload</li>
            </ul>

            <div className='mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900'>
              Shared across your account. Chats do not reset daily.
            </div>

            <Link
              href={isLoggedIn ? '/create-pet' : '/login'}
              className='subtle-button mt-6 w-full text-center'
            >
              {isLoggedIn ? 'Create Your Pet' : 'Start Free'}
            </Link>
          </article>

          <article className='glass-card relative overflow-hidden bg-gradient-to-b from-orange-50 to-amber-50 p-6'>
            <div className='absolute right-5 top-5 rounded-full bg-orange-100 px-3 py-2 text-xs font-extrabold text-orange-800'>
              Recommended
            </div>

            <div className='inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-orange-800'>
              VIP Membership
            </div>

            <h2 className='mt-4 text-2xl font-extrabold'>VIP</h2>

            <div className='mt-4 flex items-end gap-2'>
              <strong className='text-5xl font-extrabold tracking-[-0.05em]'>
                {VIP_PRICE}
              </strong>
              <span className='mb-1 text-muted'>/ month</span>
            </div>

            <p className='mt-3 text-sm leading-8 text-muted'>
              Best for users who want uninterrupted companionship, deeper memory,
              and more pet capacity.
            </p>

            <ul className='mt-5 grid gap-3 text-sm leading-7'>
              <li>✓ Unlimited chats</li>
              <li>✓ More than {FREE_TIER_MAX_PETS} pets</li>
              <li>✓ Deeper long-term memory</li>
              <li>✓ Richer emotional continuity</li>
              <li>✓ Priority access to future voice features</li>
            </ul>

            {vipActive ? (
              <Link
                href='/account'
                className='brand-button mt-6 w-full text-center'
              >
                View Current Plan
              </Link>
            ) : isLoggedIn ? (
              <form action={createVipCheckoutSession} className='mt-6'>
                <button className='brand-button w-full'>Upgrade to VIP</button>
              </form>
            ) : (
              <Link
                href='/login'
                className='brand-button mt-6 w-full text-center'
              >
                Sign in to upgrade
              </Link>
            )}

            {isLoggedIn ? (
              <form action={openBillingPortal} className='mt-3'>
                <button className='subtle-button w-full'>
                  Manage Subscription
                </button>
              </form>
            ) : null}
          </article>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-2'>
          <div className='glass-card bg-card-gradient p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
              Why users upgrade
            </div>
            <p className='mt-3 text-lg leading-9'>
              Not because EchoPaws simply answers more questions — but because it
              feels more personal over time. VIP is about memory depth, emotional
              continuity, and uninterrupted companionship.
            </p>
          </div>

          <div className='glass-card bg-card-gradient p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
              Access policy
            </div>
            <p className='mt-3 text-lg leading-9'>
              Free accounts include {FREE_TOTAL_CHAT_LIMIT} lifetime chats and up
              to {FREE_TIER_MAX_PETS} pets. VIP removes the {FREE_TOTAL_CHAT_LIMIT}
              -chat limit, unlocks more pet capacity, and gives your account a
              deeper, longer-lasting companionship layer.
            </p>
          </div>
        </section>

        <section className='mt-8 glass-card overflow-hidden p-0'>
          <div className='border-b border-black/5 px-6 py-5'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
              Free / VIP comparison
            </div>
            <h2 className='mt-2 text-2xl font-extrabold'>
              Choose the level of companionship that fits you
            </h2>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full min-w-[720px] text-left'>
              <thead className='bg-stone-50 text-sm text-stone-700'>
                <tr>
                  <th className='px-6 py-4 font-bold'>Feature</th>
                  <th className='px-6 py-4 font-bold'>Free</th>
                  <th className='px-6 py-4 font-bold'>VIP</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className='border-t border-black/5'>
                    <td className='px-6 py-4 font-semibold'>{row.feature}</td>
                    <td className='px-6 py-4 text-sm text-muted'>{row.free}</td>
                    <td className='px-6 py-4 text-sm text-stone-900'>
                      {row.vip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className='mt-8'>
          <div className='text-center'>
            <div className='eyebrow'>FAQ</div>
            <h2 className='page-title mt-4'>Questions users ask before upgrading</h2>
          </div>

          <div className='mt-8 grid gap-5 md:grid-cols-2'>
            {faqs.map((item) => (
              <article key={item.question} className='glass-card p-6'>
                <h3 className='text-lg font-extrabold'>{item.question}</h3>
                <p className='mt-3 text-sm leading-8 text-muted'>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
