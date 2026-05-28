import Link from 'next/link';
import { redirect } from 'next/navigation';
import { openBillingPortal } from '@/app/actions/billing';
import { signOut } from '@/app/actions/auth';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { findSubscriptionByUserId } from '@/lib/subscriptions';

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

  const visible = localPart.slice(0, Math.min(3, localPart.length - 1));
  return `${visible}***@${domain}`;
}

function getCopyEmailScript() {
  return `
    (() => {
      const button = document.getElementById('copy-email-button');
      const feedback = document.getElementById('copy-email-feedback');

      if (!button) return;

      let timer;

      const setButtonState = (label, success) => {
        button.textContent = label;

        if (feedback) {
          feedback.textContent = label;
        }

        if (success) {
          button.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
          button.classList.remove('bg-white', 'text-neutral-800', 'border-black/10');
        } else {
          button.classList.add('bg-white', 'text-neutral-800', 'border-black/10');
          button.classList.remove('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
        }
      };

      const fallbackCopy = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      };

      const handleClick = async () => {
        const email = button.getAttribute('data-email') || '';
        if (!email) {
          setButtonState('No Email', false);
          window.clearTimeout(timer);
          timer = window.setTimeout(() => setButtonState('Copy Email', false), 1800);
          return;
        }

        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(email);
          } else {
            const ok = fallbackCopy(email);
            if (!ok) throw new Error('Fallback copy failed');
          }

          setButtonState('Copied', true);
          window.clearTimeout(timer);
          timer = window.setTimeout(() => setButtonState('Copy Email', false), 1800);
        } catch (error) {
          setButtonState('Copy Failed', false);
          window.clearTimeout(timer);
          timer = window.setTimeout(() => setButtonState('Copy Email', false), 1800);
        }
      };

      button.addEventListener('click', handleClick);
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

  const currentPlan =
    subscription?.plan === 'vip' &&
    ['active', 'trialing', 'past_due'].includes(subscription.status)
      ? 'VIP'
      : 'Free';

  const defaultPet =
    petOverview?.pets.find((pet) => pet.id === petOverview.defaultPetId) || null;

  const email = user.email || '';
  const maskedEmail = maskEmail(email);

  return (
    <>
      <SiteHeader ctaLabel='Manage Membership' ctaHref='/pricing' />

      <main className='container-shell py-10'>
        <div className='eyebrow'>My Account</div>

        <h1 className='page-title mt-4'>Welcome back, {displayName}</h1>

        <p className='page-subtitle mx-0'>
          This is your EchoPaws account and membership hub. You can view your login
          status, manage your Stripe subscription, check your pets and default chat
          target, and securely sign out.
        </p>

        <section className='mt-8 grid gap-5 md:grid-cols-[1.1fr_.9fr]'>
          <div className='glass-card p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-extrabold'>Account Status</h2>
                <p className='mt-1 text-sm text-muted'>
                  Your account overview, plan sync status, and current pet setup.
                </p>
              </div>

              <div className='hidden rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-900 md:block'>
                Secure Account
              </div>
            </div>

            <div className='mt-5 grid gap-4 md:grid-cols-3'>
              <div className='rounded-2xl border border-black/5 bg-white p-4 shadow-sm'>
                <div className='text-sm font-bold text-muted'>Email</div>

                <div className='mt-2 text-lg font-extrabold tracking-tight text-neutral-900'>
                  {maskedEmail}
                </div>

                <div className='mt-3 rounded-2xl border border-black/5 bg-black/[0.03] p-3'>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='min-w-0 flex-1'>
                      <div className='text-[11px] font-bold uppercase tracking-[0.18em] text-muted/80'>
                        Full email
                      </div>
                      <div className='mt-1 truncate text-sm font-medium text-neutral-700'>
                        {email || 'No email available'}
                      </div>
                    </div>

                    {email ? (
                      <>
                        <button
                          id='copy-email-button'
                          type='button'
                          data-email={email}
                          className='shrink-0 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-sm'
                          aria-describedby='copy-email-feedback'
                        >
                          Copy Email
                        </button>
                        <span
                          id='copy-email-feedback'
                          className='sr-only'
                          aria-live='polite'
                        >
                          Ready to copy email
                        </span>
                      </>
                    ) : null}
                  </div>

                  <div className='mt-2 text-[11px] text-muted'>
                    Protected display with one-line truncation for a cleaner layout.
                  </div>
                </div>
              </div>

              <div className='rounded-2xl border border-black/5 bg-white p-4 shadow-sm'>
                <div className='text-sm font-bold text-muted'>Current Plan</div>
                <div className='mt-2 text-lg font-extrabold text-neutral-900'>
                  {currentPlan}
                </div>
                <div className='mt-1 text-xs text-muted'>
                  {subscription
                    ? `Status: ${subscription.status}`
                    : 'No subscription synced yet'}
                </div>
              </div>

              <div className='rounded-2xl border border-black/5 bg-white p-4 shadow-sm'>
                <div className='text-sm font-bold text-muted'>Pets</div>
                <div className='mt-2 text-lg font-extrabold text-neutral-900'>
                  {petOverview?.pets.length || 0}
                </div>
                <div className='mt-1 text-xs text-muted'>
                  {defaultPet ? `Default: ${defaultPet.name}` : 'No default pet set'}
                </div>
              </div>
            </div>

            <div className='mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
              Plan status is synced from Stripe via webhook. If you just upgraded to
              VIP, allow a few moments for the webhook to update your subscription
              record.
            </div>
          </div>

          <div className='glass-card p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-extrabold'>Membership & Security</h2>
                <p className='mt-1 text-sm text-muted'>
                  Billing, membership management, pet setup, and secure sign out.
                </p>
              </div>

              <div className='hidden rounded-full bg-black/[0.04] px-3 py-1 text-xs font-bold text-neutral-700 md:block'>
                Quick Actions
              </div>
            </div>

            <div className='mt-5 grid gap-3'>
              <form action={openBillingPortal}>
                <button className='subtle-button w-full'>Open Stripe Billing Portal</button>
              </form>

              <Link href='/pricing' className='brand-button w-full text-center'>
                View Membership Plans
              </Link>

              <Link href='/pets' className='subtle-button w-full text-center'>
                Manage Pets & Default Target
              </Link>

              <form action={signOut}>
                <button className='subtle-button w-full'>Sign Out Securely</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <script dangerouslySetInnerHTML={{ __html: getCopyEmailScript() }} />

      <SiteFooter rightText='Account · Membership · Default Pet · Sign Out' />
    </>
  );
}
