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
const ACTIVE_VIP_STATUSES = ['active', 'trialing', 'past_due'];

function maskEmail(email: string | null | undefined) {
  if (!email || !email.includes('@')) return 'No email available';

  const [localPart, domain] = email.split('@');
  const safeLocal =
    localPart.length <= 3 ? `${localPart.slice(0, 1)}***` : `${localPart.slice(0, 3)}***`;

  return `${safeLocal}@${domain}`;
}

function getPlanStatusLabel(status?: string | null) {
  if (!status) return 'No active subscription';
  if (status === 'active') return 'Active';
  if (status === 'trialing') return 'Trialing';
  if (status === 'past_due') return 'Past due';
  if (status === 'canceled') return 'Canceled';
  if (status === 'incomplete') return 'Incomplete';
  return status;
}

function getCopyEmailScript() {
  return `
    (() => {
      const button = document.getElementById('copy-email-button');
      const feedback = document.getElementById('copy-email-feedback');
      if (!button || !feedback) return;

      const originalText = feedback.textContent || 'Copy email';

      button.addEventListener('click', async () => {
        const email = button.getAttribute('data-email');
        if (!email) return;

        try {
          await navigator.clipboard.writeText(email);
          feedback.textContent = 'Copied';
          setTimeout(() => {
            feedback.textContent = originalText;
          }, 1800);
        } catch (error) {
          feedback.textContent = 'Copy failed';
          setTimeout(() => {
            feedback.textContent = originalText;
          }, 1800);
        }
      });
    })();
  `;
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

  const vipActive =
    subscription?.plan === 'vip' && ACTIVE_VIP_STATUSES.includes(subscription.status ?? '');

  const currentPlan = vipActive ? 'VIP Membership' : 'Free Plan';
  const planBadge = vipActive ? 'VIP Active' : 'Free Plan';
  const planStatus = vipActive ? getPlanStatusLabel(subscription?.status) : 'Free plan active';

  const pets = petOverview?.pets ?? [];
  const petCount = pets.length;
  const defaultPet = pets.find((pet) => pet.id === petOverview?.defaultPetId) || null;

  const maskedEmail = maskEmail(user.email);
  const fullEmail = user.email ?? 'No email available';
  const freeSlotsLeft = Math.max(FREE_TIER_MAX_PETS - petCount, 0);

  return (
    <>
      <div className='hidden md:block'>
        <SiteHeader
          ctaLabel={vipActive ? 'Manage Membership' : 'Upgrade to VIP'}
          ctaHref='/pricing'
        />
      </div>

      <main className='container-shell py-10'>
        <div className='eyebrow'>My Account</div>
        <h1 className='page-title mt-4'>Welcome back, {displayName}</h1>
        <p className='page-subtitle mx-0 max-w-4xl'>
          Review your current plan, Free versus VIP benefits, pet setup, and membership controls in
          one place.
        </p>

        <section className='mt-8 grid gap-5 md:grid-cols-[1.1fr_.9fr]'>
          <div className='glass-card p-6'>
            <div className='flex flex-wrap items-center gap-3'>
              <h2 className='text-2xl font-extrabold'>Account Status</h2>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] ${
                  vipActive ? 'bg-orange-100 text-orange-800' : 'bg-stone-100 text-stone-700'
                }`}
              >
                {planBadge}
              </span>
            </div>

            <div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <div className='text-sm font-bold text-muted'>Email</div>
                <div className='mt-2 text-base font-semibold'>{maskedEmail}</div>

                <div className='mt-2 grid gap-2'>
                  <div className='rounded-2xl bg-stone-50 px-3 py-2 text-xs text-muted break-all'>
                    {fullEmail}
                  </div>

                  <button
                    id='copy-email-button'
                    type='button'
                    data-email={fullEmail}
                    className='w-fit shrink-0 rounded-full border border-black/10 bg-stone-50 px-3 py-1 text-xs font-bold text-stone-700 transition hover:bg-stone-100'
                  >
                    <span id='copy-email-feedback'>Copy email</span>
                  </button>
                </div>
              </div>

              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <div className='text-sm font-bold text-muted'>Current Plan</div>
                <div className='mt-2 text-base font-semibold'>{currentPlan}</div>
                <div className='mt-1 text-xs text-muted'>{planStatus}</div>
              </div>

              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <div className='text-sm font-bold text-muted'>Pets</div>
                <div className='mt-2 text-base font-semibold'>{petCount}</div>
                <div className='mt-1 text-xs text-muted'>
                  {defaultPet ? `Default pet: ${defaultPet.name}` : 'No default pet set'}
                </div>
              </div>

              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <div className='text-sm font-bold text-muted'>
                  {vipActive ? 'Chat Access' : 'Free Chat Allowance'}
                </div>
                <div className='mt-2 text-base font-semibold'>
                  {vipActive ? 'Unlimited' : `${FREE_TOTAL_CHAT_LIMIT} total`}
                </div>
                <div className='mt-1 text-xs text-muted'>
                  {vipActive ? 'Unlimited chats with VIP' : 'Lifetime chats, not daily reset'}
                </div>
              </div>
            </div>

            {!vipActive ? (
              <div className='mt-5 rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-900'>
                <div className='text-xs font-extrabold uppercase tracking-[0.1em] text-amber-800'>
                  Free plan snapshot
                </div>
                <p className='mt-2 leading-7'>
                  Your account is currently on Free. Free includes{' '}
                  <strong>{FREE_TOTAL_CHAT_LIMIT} total lifetime chats</strong> and{' '}
                  <strong>up to {FREE_TIER_MAX_PETS} pets</strong>. These chats are shared across
                  your account and do not reset daily.
                </p>
              </div>
            ) : (
              <div className='mt-5 rounded-2xl bg-orange-50 px-4 py-4 text-sm text-orange-900'>
                <div className='text-xs font-extrabold uppercase tracking-[0.1em] text-orange-800'>
                  VIP membership active
                </div>
                <p className='mt-2 leading-7'>
                  Your account currently has VIP access. You have unlimited chats, more pet
                  capacity, deeper long-term memory, richer emotional continuity, and priority
                  access to future voice features.
                </p>
              </div>
            )}
          </div>

          <div className='glass-card p-6'>
            <div className='flex flex-wrap items-center gap-3'>
              <h2 className='text-2xl font-extrabold'>Membership & Security</h2>
              <span className='inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-stone-700'>
                Quick Actions
              </span>
            </div>

            <div className='mt-5 grid gap-3'>
              <form action={openBillingPortal}>
                <button type='submit' className='subtle-button w-full'>
                  Open Stripe Billing Portal
                </button>
              </form>

              {!vipActive ? (
                <Link href='/pricing' className='brand-button w-full text-center'>
                  Upgrade to VIP
                </Link>
              ) : (
                <Link href='/pricing' className='subtle-button w-full text-center'>
                  View Membership Details
                </Link>
              )}

              <Link href='/pets' className='subtle-button w-full text-center'>
                Manage Pets & Default Pet
              </Link>

              <form action={signOut}>
                <button type='submit' className='subtle-button w-full'>
                  Sign Out Securely
                </button>
              </form>
            </div>

            <div className='mt-5 rounded-2xl border border-black/5 bg-stone-50 px-4 py-4 text-sm text-stone-700'>
              If you just upgraded, your VIP status may take a moment to appear here after checkout.
            </div>
          </div>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-2'>
          <article className='glass-card p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-stone-700'>
              Free plan
            </div>
            <h2 className='mt-2 text-2xl font-extrabold'>What Free includes</h2>

            <ul className='mt-5 grid gap-3 text-sm leading-7'>
              <li>✓ {FREE_TOTAL_CHAT_LIMIT} total lifetime chats</li>
              <li>✓ Up to {FREE_TIER_MAX_PETS} pets</li>
              <li>✓ Basic memory capability</li>
              <li>✓ Pet profile and photo upload</li>
            </ul>

            <div className='mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700'>
              {petCount >= FREE_TIER_MAX_PETS && !vipActive
                ? `You currently have ${petCount} pets on the Free plan. You’ve reached the Free pet limit. Upgrade to VIP if you want more pet capacity.`
                : !vipActive
                  ? `You can still create ${freeSlotsLeft} more ${freeSlotsLeft === 1 ? 'pet' : 'pets'} on Free.`
                  : 'Your account is not currently limited by the Free plan.'}
            </div>
          </article>

          <article className='glass-card bg-gradient-to-b from-orange-50 to-amber-50 p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
              VIP membership
            </div>
            <h2 className='mt-2 text-2xl font-extrabold'>What VIP unlocks</h2>

            <div className='mt-4 flex items-end gap-2'>
              <strong className='text-4xl font-extrabold tracking-[-0.05em]'>$12.9</strong>
              <span className='mb-1 text-muted'>/ month</span>
            </div>

            <ul className='mt-5 grid gap-3 text-sm leading-7'>
              <li>✓ Unlimited chats</li>
              <li>✓ More than {FREE_TIER_MAX_PETS} pets</li>
              <li>✓ Deeper long-term memory</li>
              <li>✓ Richer emotional continuity</li>
              <li>✓ Priority access to future voice features</li>
            </ul>

            <div className='mt-5 rounded-2xl bg-orange-100/70 px-4 py-3 text-sm text-orange-900'>
              VIP is best for users who want uninterrupted companionship, more pet capacity, and a
              pet that remembers with greater depth over time.
            </div>
          </article>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-2'>
          <article className='glass-card p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-stone-700'>
              Plan rules
            </div>
            <p className='mt-3 text-sm leading-8 text-muted'>
              Free accounts include {FREE_TOTAL_CHAT_LIMIT} total lifetime chats and can keep up to{' '}
              {FREE_TIER_MAX_PETS} pets. VIP removes the {FREE_TOTAL_CHAT_LIMIT}-chat limit,
              unlocks more pet capacity, and gives your pet deeper memory continuity.
            </p>
          </article>

          <article className='glass-card p-6'>
            <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-stone-700'>
              Privacy & control
            </div>
            <p className='mt-3 text-sm leading-8 text-muted'>
              You can manage pets, open billing, and sign out from this page. For the cleanest
              mobile experience, Sign In and Upgrade actions are handled by the shared mobile top
              bar, while the desktop site keeps the full site header.
            </p>
          </article>
        </section>
      </main>

      <SiteFooter />
      <script dangerouslySetInnerHTML={{ __html: getCopyEmailScript() }} />
    </>
  );
}
