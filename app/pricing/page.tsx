import { createVipCheckoutSession, openBillingPortal } from '@/app/actions/billing';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

const comparisonRows = [
  {
    feature: 'Price',
    free: '$0 forever',
    vip: '$12.9 / month',
  },
  {
    feature: 'Chats',
    free: '20 total lifetime chats',
    vip: 'Unlimited chats',
  },
  {
    feature: 'Pet slots',
    free: 'Up to 2 AI pets',
    vip: 'More than 2 AI pets',
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
    vip: 'Building a real long-term emotional bond',
  },
];

const faqs = [
  {
    question: 'How does payment work for VIP?',
    answer:
      'VIP is billed monthly through Stripe. Once payment succeeds, your account unlocks unlimited chat, deeper long-term memory, and support for creating more than 2 pets.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes. You can open the billing portal at any time and cancel your subscription. Your VIP benefits stay active until the end of the current billing period.',
  },
  {
    question: 'Do free chats reset every day?',
    answer:
      'No. Free accounts receive 20 total lifetime trial chats for the account. The counter does not refresh daily. Once those 20 chats are used, you need VIP to continue chatting.',
  },
  {
    question: 'What exactly does VIP unlock?',
    answer:
      'VIP removes the 20-chat free-trial cap, unlocks unlimited conversations, supports more than 2 pets, gives access to deeper long-term memory, and prepares your account for future companion features like voice.',
  },
  {
    question: 'What happens to my data if I cancel VIP?',
    answer:
      'Your pet profiles, memories, and account data stay in place. Cancelling VIP does not instantly delete your data. It only changes your access level after the current billing cycle ends.',
  },
  {
    question: 'Will my pets and memories be deleted if I stay on Free?',
    answer:
      'No. Existing pet data and memory data remain associated with your account. However, Free accounts still remain limited to 20 total chats and up to 2 pets.',
  },
  {
    question: 'Can I create more pets after upgrading to VIP?',
    answer:
      'Yes. VIP is designed for users who want to build a larger companion world. Once upgraded, you are no longer limited by the Free-tier 2-pet cap.',
  },
  {
    question: 'Which payment methods are supported?',
    answer:
      'Stripe typically supports major credit and debit cards, and may also support Apple Pay or Google Pay depending on your region and device.',
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: { error?: string; billing?: string; checkout?: string };
}) {
  let isLoggedIn = false;

  if (hasSupabaseEnv()) {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }

  return (
    <>
      <SiteHeader ctaLabel='Upgrade Now' ctaHref='#plans' />

      <main className='container-shell py-10'>
        <section className='text-center'>
          <div className='eyebrow'>Membership</div>
          <h1 className='page-title mt-4'>
            Pricing designed for deeper companionship
          </h1>
          <p className='section-subtitle mx-auto max-w-3xl'>
            Start free, then upgrade only when the bond feels real. EchoPaws VIP is
            not about counting messages — it is about preserving continuity,
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
            Payment successful! Your VIP membership is now active. Enjoy unlimited
            conversations with your companion.
          </div>
        ) : null}

        {searchParams?.checkout === 'cancelled' ? (
          <div className='mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900'>
            Subscription cancelled. You can resubscribe anytime to unlock VIP again.
          </div>
        ) : null}

        <section id='plans' className='mt-8 grid gap-5 md:grid-cols-2'>
          <article className='glass-card p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
              Free Trial
            </div>

            <h2 className='mt-3 text-2xl font-extrabold'>Free Tier</h2>

            <div className='mt-4 flex items-end gap-2'>
              <strong className='text-5xl font-extrabold tracking-[-0.05em]'>
                $0
              </strong>
              <span className='mb-1 text-muted'>/ forever</span>
            </div>

            <p className='mt-3 text-sm leading-8 text-muted'>
              Great for first-time exploration. Meet your companion, try the core
              chat experience, and see whether the emotional bond feels right.
            </p>

            <ul className='mt-5 grid gap-3 text-sm leading-7'>
              <li>✓ 20 total lifetime chats</li>
              <li>✓ Up to 2 AI pets</li>
              <li>✓ Basic memory capability</li>
              <li>✓ Pet profile and photo upload</li>
            </ul>

            <div className='mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-xs leading-6 text-orange-900'>
              Free chats are shared across the account and do not refresh daily.
            </div>

            <a
              href={isLoggedIn ? '/create-pet' : '/login'}
              className='subtle-button mt-6 w-full text-center'
            >
              Start Free
            </a>
          </article>

          <article className='glass-card relative overflow-hidden bg-gradient-to-b from-orange-50 to-amber-50 p-6'>
            <div className='absolute right-5 top-5 rounded-full bg-orange-100 px-3 py-2 text-xs font-extrabold text-orange-800'>
              Recommended
            </div>

            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
              Most Loved Plan
            </div>

            <h2 className='mt-3 text-2xl font-extrabold'>VIP Membership</h2>

            <div className='mt-4 flex items-end gap-2'>
              <strong className='text-5xl font-extrabold tracking-[-0.05em]'>
                $12.9
              </strong>
              <span className='mb-1 text-muted'>/ month</span>
            </div>

            <p className='mt-3 text-sm leading-8 text-muted'>
              For users who want deeper continuity, richer emotional companionship,
              and a pet that keeps remembering instead of resetting.
            </p>

            <ul className='mt-5 grid gap-3 text-sm leading-7'>
              <li>✓ Unlimited chats</li>
              <li>✓ Create more than 2 AI pets</li>
              <li>✓ Deeper long-term memory</li>
              <li>✓ Richer emotional continuity</li>
              <li>✓ Priority access to future voice features</li>
            </ul>

            <form action={createVipCheckoutSession} className='mt-6'>
              <button className='brand-button w-full'>
                Unlock Unlimited Companionship
              </button>
            </form>

            <form action={openBillingPortal} className='mt-3'>
              <button className='subtle-button w-full'>
                Manage Subscription
              </button>
            </form>
          </article>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-2'>
          <div className='glass-card bg-card-gradient p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
              Why users upgrade
            </div>
            <p className='mt-3 text-lg leading-9'>
              Not because it answers more questions — but because it feels more like
              their pet, uniquely theirs. VIP is about memory depth, emotional
              continuity, and uninterrupted companionship.
            </p>
          </div>

          <div className='glass-card bg-card-gradient p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
              Access policy
            </div>
            <p className='mt-3 text-lg leading-9'>
              Free accounts receive 20 total lifetime chats and can keep up to 2 AI
              pets. VIP removes the free-trial counter, unlocks more pet capacity,
              and gives your account a deeper, more persistent companionship layer.
            </p>
          </div>
        </section>

        <section className='mt-10 glass-card p-6'>
          <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
            Free / VIP Comparison
          </div>
          <h3 className='mt-3 text-2xl font-extrabold'>
            Choose the level of companionship that fits you
          </h3>

          <div className='mt-5 overflow-x-auto'>
            <table className='min-w-full overflow-hidden rounded-2xl border border-black/5 bg-white text-left text-sm'>
              <thead className='bg-orange-50 text-orange-900'>
                <tr>
                  <th className='px-4 py-3 font-extrabold'>Feature</th>
                  <th className='px-4 py-3 font-extrabold'>Free</th>
                  <th className='px-4 py-3 font-extrabold'>VIP</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className='border-t border-black/5 align-top'>
                    <td className='px-4 py-3 font-bold text-ink'>{row.feature}</td>
                    <td className='px-4 py-3 text-muted'>{row.free}</td>
                    <td className='px-4 py-3 text-ink'>{row.vip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className='mt-10 glass-card p-6'>
          <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
            FAQ
          </div>
          <h3 className='mt-3 text-2xl font-extrabold'>
            Questions users usually ask before upgrading
          </h3>

          <div className='mt-6 grid gap-5 md:grid-cols-2'>
            {faqs.map((item) => (
              <div key={item.question} className='rounded-2xl border border-black/5 bg-white p-5'>
                <div className='text-base font-extrabold text-ink'>
                  {item.question}
                </div>
                <p className='mt-2 text-sm leading-7 text-muted'>{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter rightText='EchoPaws · Membership · Memory · Companionship' />
    </>
  );
}
