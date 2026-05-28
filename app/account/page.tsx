import Link from 'next/link';
import { redirect } from 'next/navigation';
import { openBillingPortal } from '@/app/actions/billing';
import { signOut } from '@/app/actions/auth';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { findSubscriptionByUserId } from '@/lib/subscriptions';

const FREE_TOTAL_CHAT_LIMIT = 20;
const FREE_TIER_MAX_PETS = 2;
const ACTIVE_VIP_STATUSES = new Set(['active', 'trialing', 'past_due']);

function isVipActive(
  subscription: { plan?: string | null; status?: string | null } | null | undefined,
) {
  return subscription?.plan === 'vip' && ACTIVE_VIP_STATUSES.has(subscription.status ?? '');
}

function maskEmail(email?: string | null) {
  if (!email) return 'No email available';

  const [localPart = '', domain = ''] = email.split('@');
  if (!localPart || !domain) return email;

  if (localPart.length <= 1) {
    return `${localPart}***@${domain}`;
  }

  if (localPart.length === 2) {
    return `${localPart[0]}***@${domain}`;
  }

  return `${localPart.slice(0, 3)}***@${domain}`;
}

export default async function AccountPage() {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please%20configure%20Supabase%20environment%20variables%20first.');
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please%20sign%20in%20to%20view%20your%20account.');
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Friend';

  let subscription: Awaited<ReturnType<typeof findSubscriptionByUserId>> | null = null;
  let petOverview: Awaited<ReturnType<typeof getPetsForUser>> | null = null;

  try {
    [subscription, petOverview] = await Promise.all([
      findSubscriptionByUserId(user.id),
      getPetsForUser(user.id),
    ]);
  } catch {
    subscription = null;
    petOverview = null;
  }

  const vipActive = isVipActive(subscription);
  const currentPlan = vipActive ? 'VIP' : 'Free';
  const petCount = petOverview?.pets.length || 0;
  const defaultPet =
    petOverview?.pets.find((pet) => pet.id === petOverview.defaultPetId) || null;
  const maskedEmail = maskEmail(user.email);
  const freeSlotsLeft = Math.max(FREE_TIER_MAX_PETS - petCount, 0);

  const freePlanHighlights = [
    '20 total lifetime chats',
    `Up to ${FREE_TIER_MAX_PETS} AI pets`,
    'Basic memory capability',
    'Pet profile and photo upload',
  ];

  const vipPlanHighlights = [
    'Unlimited chats',
    `More than ${FREE_TIER_MAX_PETS} pets`,
    'Deeper long-term memory',
    'Richer emotional continuity',
    'Priority access to future voice features',
  ];

  return (
    <>
      <SiteHeader
        ctaLabel={vipActive ? 'Manage Membership' : 'Upgrade to VIP'}
        ctaHref='/pricing'
      />

      <main className='container-shell py-10'>
        <div className='eyebrow'>My Account</div>

        <h1 className='page-title mt-4'>Welcome back, {displayName}</h1>

        <p className='page-subtitle mx-0'>
          Review your current plan, Free versus VIP benefits, pet setup, and
          membership controls in one place.
        </p>

        <section className='mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]'>
          <div className='glass-card p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-extrabold'>Account Status</h2>
                <p className='mt-1 text-sm text-muted'>
                  Your sign-in identity, current plan, and pet setup overview.
                </p>
              </div>

              <div
                className={`hidden rounded-full px-3 py-1 text-xs font-bold md:block ${
                  vipActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {vipActive ? 'VIP Active' : 'Free Plan'}
              </div>
            </div>

            <div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <div className='rounded-2xl border border-black/5 bg-white p-4 shadow-sm'>
                <div className='text-sm font-bold text-muted'>Email</div>
                <div className='mt-2 text-lg font-extrabold tracking-tight text-neutral-900'>
                  {maskedEmail}
                </div>
                <div className='mt-1 truncate text-xs text-muted'>
                  {user.email || 'No email available'}
                </div>
              </div>

              <div className='rounded-2xl border border-black/5 bg-white p-4 shadow-sm'>
                <div className='text-sm font-bold text-muted'>Current Plan</div>
                <div className='mt-2 text-lg font-extrabold text-neutral-900'>
                  {currentPlan}
                </div>
                <div className='mt-1 text-xs text-muted'>
                  {subscription
                    ? `Stripe status: ${subscription.status}`
                    : 'No subscription synced yet'}
                </div>
              </div>

              <div className='rounded-2xl border border-black/5 bg-white p-4 shadow-sm'>
                <div className='text-sm font-bold text-muted'>Pets</div>
                <div className='mt-2 text-lg font-extrabold text-neutral-900'>
                  {petCount}
                </div>
                <div className='mt-1 text-xs text-muted'>
                  {defaultPet ? `Default: ${defaultPet.name}` : 'No default pet set'}
                </div>
              </div>

              <div className='rounded-2xl border border-black/5 bg-white p-4 shadow-sm'>
                <div className='text-sm font-bold text-muted'>
                  {vipActive ? 'Chat Access' : 'Free Chat Allowance'}
                </div>
                <div className='mt-2 text-lg font-extrabold text-neutral-900'>
                  {vipActive ? 'Unlimited' : `${FREE_TOTAL_CHAT_LIMIT} total`}
                </div>
                <div className='mt-1 text-xs text-muted'>
                  {vipActive
                    ? 'No Free chat cap'
                    : 'Lifetime chats, not daily reset'}
                </div>
              </div>
            </div>

            <div
              className={`mt-5 rounded-2xl px-4 py-4 text-sm leading-7 ${
                vipActive
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              <div className='font-extrabold uppercase tracking-[0.06em]'>
                {vipActive ? 'Current Membership Snapshot' : 'Free Plan Snapshot'}
              </div>

              {vipActive ? (
                <div className='mt-2'>
                  Your account currently has <strong>VIP access</strong>. That means
                  unlimited chats, more than {FREE_TIER_MAX_PETS} pets, deeper
                  long-term memory, and stronger emotional continuity across your
                  companion experience.
                </div>
              ) : (
                <div className='mt-2'>
                  Your account is currently on <strong>Free</strong>. Free includes{' '}
                  <strong>{FREE_TOTAL_CHAT_LIMIT} total lifetime chats</strong> and up
                  to <strong>{FREE_TIER_MAX_PETS} AI pets</strong>. These chats are
                  shared across the account and do <strong>not</strong> reset daily.
                </div>
              )}
            </div>
          </div>

          <div className='glass-card p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-extrabold'>Membership & Security</h2>
                <p className='mt-1 text-sm text-muted'>
                  Billing, plan upgrade, pet management, and secure sign out.
                </p>
              </div>

              <div className='hidden rounded-full bg-black/[0.04] px-3 py-1 text-xs font-bold text-neutral-700 md:block'>
                Quick Actions
              </div>
            </div>

            <div className='mt-5 grid gap-3'>
              <form action={openBillingPortal}>
                <button className='subtle-button w-full'>
                  Open Stripe Billing Portal
                </button>
              </form>

              <Link href='/pricing' className='brand-button w-full text-center'>
                {vipActive ? 'Review Membership Details' : 'Upgrade to VIP'}
              </Link>

              <Link href='/pets' className='subtle-button w-full text-center'>
                Manage Pets
              </Link>

              <form action={signOut}>
                <button className='subtle-button w-full'>Sign Out Securely</button>
              </form>
            </div>
          </div>
        </section>

        <section className='mt-8 grid gap-5 lg:grid-cols-2'>
          <div className='glass-card p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
                  Free Plan
                </div>
                <h2 className='mt-2 text-2xl font-extrabold'>What Free includes</h2>
              </div>

              {!vipActive ? (
                <div className='rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800'>
                  Current Plan
                </div>
              ) : null}
            </div>

            <ul className='mt-5 grid gap-3 text-sm leading-7 text-ink'>
              {freePlanHighlights.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>

            <div className='mt-5 rounded-2xl border border-black/5 bg-white p-4 text-sm leading-7 text-muted'>
              {!vipActive ? (
                <>
                  You currently have <strong>{petCount}</strong> pet
                  {petCount !== 1 ? 's' : ''} on Free tier.
                  {freeSlotsLeft > 0 ? (
                    <>
                      {' '}
                      You can still create <strong>{freeSlotsLeft}</strong> more pet
                      {freeSlotsLeft !== 1 ? 's' : ''} before reaching the Free-tier
                      cap of <strong>{FREE_TIER_MAX_PETS}</strong>.
                    </>
                  ) : (
                    <>
                      {' '}
                      You have already reached the Free-tier pet cap. Upgrade to VIP
                      if you want more companions.
                    </>
                  )}
                </>
              ) : (
                <>You are currently on VIP, so the Free-tier pet cap no longer limits your account.</>
              )}
            </div>
          </div>

          <div className='glass-card p-6 bg-gradient-to-b from-orange-50 to-amber-50'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
                  VIP Membership
                </div>
                <h2 className='mt-2 text-2xl font-extrabold'>
                  What VIP unlocks
                </h2>
              </div>

              {vipActive ? (
                <div className='rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800'>
                  Active Now
                </div>
              ) : (
                <div className='rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800'>
                  $12.9 / month
                </div>
              )}
            </div>

            <ul className='mt-5 grid gap-3 text-sm leading-7 text-ink'>
              {vipPlanHighlights.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>

            <div className='mt-5 rounded-2xl border border-orange-200 bg-white/80 p-4 text-sm leading-7 text-muted'>
              {vipActive ? (
                <>
                  Your VIP benefits remain active{' '}
                  {subscription?.status
                    ? `while Stripe status is "${subscription.status}".`
                    : 'for the current subscription period.'}
                </>
              ) : (
                <>
                  VIP is best for users who want uninterrupted companionship, more than{' '}
                  {FREE_TIER_MAX_PETS} pets, and a pet that remembers with greater
                  depth and continuity over time.
                </>
              )}
            </div>
          </div>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-2'>
          <div className='glass-card bg-card-gradient p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
              Plan Rules
            </div>
            <p className='mt-3 text-lg leading-9'>
              Free accounts receive {FREE_TOTAL_CHAT_LIMIT} total lifetime chats and
              can keep up to {FREE_TIER_MAX_PETS} pets. VIP removes the Free chat cap,
              unlocks more pet capacity, and gives your companion deeper long-term
              memory.
            </p>
          </div>

          <div className='glass-card bg-card-gradient p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
              Billing Note
            </div>
            <p className='mt-3 text-lg leading-9'>
              Membership status is synced from Stripe via webhook. If you just
              upgraded, please allow a short moment for your VIP status to appear here
              after checkout.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter rightText='Account · Membership · Pets · Billing · Sign Out' />
    </>
  );
}
