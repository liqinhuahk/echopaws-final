export const dynamic = 'force-dynamic';

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

function BenefitItem({ text }: { text: string }) {
  return (
    <li className='flex items-start gap-3'>
      <span className='mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/12 text-[11px] font-black text-amber-300'>
        ✓
      </span>
      <span className='text-[rgba(255,244,230,0.78)]'>{text}</span>
    </li>
  );
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
    <div className='app-brand-backdrop'>
      <SiteHeader
        theme='dark'
        ctaLabel={vipActive ? 'Manage Membership' : 'Upgrade to VIP'}
        ctaHref='/pricing'
      />

      <main className='container-shell py-8 md:py-10'>
        <section className='glass-card p-6 md:p-8'>
          <div className='eyebrow'>👤 My Account</div>

          <h1 className='page-title mt-5 text-[clamp(2.4rem,5vw,4.4rem)]'>
            Welcome back, {displayName}
          </h1>

          <p className='page-subtitle mt-4 max-w-4xl text-[1rem] leading-[1.95]'>
            Review your current membership, pet setup, Free versus VIP benefits, billing access,
            and security controls in one warm, unified space that matches the EchoPaws home
            experience.
          </p>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-[1.1fr_.9fr]'>
          <div className='glass-card p-6'>
            <div className='flex flex-wrap items-center gap-3'>
              <h2 className='section-title text-2xl'>Account Status</h2>
              <span
                className={`tag-chip ${
                  vipActive ? 'tag-chip--warm' : 'tag-chip--soft'
                }`}
              >
                {planBadge}
              </span>
            </div>

            <div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <div className='dark-shell-panel p-4'>
                <div className='text-sm font-bold text-soft'>Email</div>
                <div className='mt-2 text-base font-semibold text-strong'>{maskedEmail}</div>

                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  <button
                    id='copy-email-button'
                    type='button'
                    data-email={fullEmail}
                    className='subtle-button min-h-[36px] px-3 text-xs'
                  >
                    <span id='copy-email-feedback'>Copy email</span>
                  </button>

                  <span className='text-xs text-soft'>Full email hidden for privacy</span>
                </div>
              </div>

              <div className='dark-shell-panel p-4'>
                <div className='text-sm font-bold text-soft'>Current Plan</div>
                <div className='mt-2 text-base font-semibold text-strong'>{currentPlan}</div>
                <div className='mt-1 text-xs text-soft'>{planStatus}</div>
              </div>

              <div className='dark-shell-panel p-4'>
                <div className='text-sm font-bold text-soft'>Pets</div>
                <div className='mt-2 text-base font-semibold text-strong'>{petCount}</div>
                <div className='mt-1 text-xs text-soft'>
                  {defaultPet ? `Default pet: ${defaultPet.name}` : 'No default pet set'}
                </div>
              </div>

              <div className='dark-shell-panel p-4'>
                <div className='text-sm font-bold text-soft'>
                  {vipActive ? 'Chat Access' : 'Free Chat Allowance'}
                </div>
                <div className='mt-2 text-base font-semibold text-strong'>
                  {vipActive ? 'Unlimited' : `${FREE_TOTAL_CHAT_LIMIT} total`}
                </div>
                <div className='mt-1 text-xs text-soft'>
                  {vipActive ? 'Unlimited chats with VIP' : 'Lifetime chats, not daily reset'}
                </div>
              </div>
            </div>

            {!vipActive ? (
              <div className='mt-5 rounded-2xl border border-amber-300/14 bg-amber-400/8 px-4 py-4 text-sm text-amber-100'>
                <div className='text-xs font-extrabold uppercase tracking-[0.12em] text-amber-300'>
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
              <div className='mt-5 rounded-2xl border border-orange-300/14 bg-orange-400/8 px-4 py-4 text-sm text-orange-100'>
                <div className='text-xs font-extrabold uppercase tracking-[0.12em] text-orange-300'>
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
              <h2 className='section-title text-2xl'>Membership & Security</h2>
              <span className='tag-chip tag-chip--soft'>Quick Actions</span>
            </div>

            <div className='mt-5 grid gap-3'>
              <form action={openBillingPortal}>
                <button type='submit' className='subtle-button w-full'>
                  Manage Subscription
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

            <div className='mt-5 rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-body'>
              If you just upgraded, your VIP status may take a moment to appear here after checkout.
            </div>
          </div>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-2'>
          <article className='glass-card p-6'>
            <div className='eyebrow'>Free plan</div>
            <h2 className='section-title mt-4 text-2xl'>What Free includes</h2>

            <ul className='mt-5 grid gap-3 text-sm leading-7'>
              <BenefitItem text={`${FREE_TOTAL_CHAT_LIMIT} total lifetime chats`} />
              <BenefitItem text={`Up to ${FREE_TIER_MAX_PETS} pets`} />
              <BenefitItem text='Basic memory capability' />
              <BenefitItem text='Pet profile and photo upload' />
            </ul>

            <div className='mt-5 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-body'>
              {petCount >= FREE_TIER_MAX_PETS && !vipActive
                ? `You currently have ${petCount} pets on the Free plan. You've reached the Free pet limit. Upgrade to VIP if you want more pet capacity.`
                : !vipActive
                  ? `You can still create ${freeSlotsLeft} more ${
                      freeSlotsLeft === 1 ? 'pet' : 'pets'
                    } on Free.`
                  : 'Your account is not currently limited by the Free plan.'}
            </div>
          </article>

          <article className='glass-card p-6'>
            <div className='eyebrow'>VIP membership</div>
            <h2 className='section-title mt-4 text-2xl'>What VIP unlocks</h2>

            <div className='mt-4 flex items-end gap-1'>
              <strong className='text-4xl font-extrabold tracking-[-0.05em] text-strong'>
                $9.99
              </strong>
              <span className='mb-1 text-sm font-semibold text-soft'>/Month</span>
            </div>

            <ul className='mt-5 grid gap-3 text-sm leading-7'>
              <BenefitItem text='Unlimited chats' />
              <BenefitItem text={`More than ${FREE_TIER_MAX_PETS} pets`} />
              <BenefitItem text='Deeper long-term memory' />
              <BenefitItem text='Richer emotional continuity' />
              <BenefitItem text='Priority access to future voice features' />
            </ul>

            <div className='mt-5 rounded-2xl border border-orange-300/14 bg-orange-400/8 px-4 py-3 text-sm text-orange-100'>
              VIP is best for users who want uninterrupted companionship, more pet capacity, and a
              pet that remembers with greater depth over time.
            </div>
          </article>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-2'>
          <article className='glass-card p-6'>
            <div className='eyebrow'>Plan rules</div>
            <p className='mt-4 text-sm leading-8 text-body'>
              Free accounts include {FREE_TOTAL_CHAT_LIMIT} total lifetime chats and can keep up to{' '}
              {FREE_TIER_MAX_PETS} pets. VIP removes the {FREE_TOTAL_CHAT_LIMIT}-chat limit,
              unlocks more pet capacity, and gives your pet deeper memory continuity.
            </p>

            <div className='mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm leading-7 text-body'>
              Keep in mind that plan changes may take a short moment to sync after checkout or
              billing updates. If your plan status looks outdated, refresh once after returning
              from billing.
            </div>
          </article>

          <article className='glass-card p-6'>
            <div className='eyebrow'>Privacy & Control</div>
            <p className='mt-4 text-sm leading-8 text-body'>
              Your account gives you control over sign-in status, pet management, and subscription
              access. You can sign out at any time, manage your membership from the billing portal,
              and review which pet is set as your current default companion.
            </p>

            <div className='mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm leading-7 text-body'>
              For privacy, your full email address is hidden in the UI. Use the copy button if you
              need the complete address for support, billing, or login troubleshooting.
            </div>
          </article>
        </section>
      </main>

      <SiteFooter text='© 2026 EchoPaws.ai. All Rights Reserved.' />
      <script dangerouslySetInnerHTML={{ __html: getCopyEmailScript() }} />
    </div>
  );
}
