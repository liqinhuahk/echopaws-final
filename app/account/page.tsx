import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import SiteHeader from '@/components/site-header';
import {
  getOrCreateStripeCustomer,
  STRIPE_VIP_PRICE_ID,
  stripe,
} from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.echopaws.ai';

type BillingSnapshot = {
  hasCustomer: boolean;
  isVip: boolean;
  planName: string;
  statusLabel: string;
  customerId: string | null;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
  allowanceText: string;
  petText: string;
};

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgba(255,224,206,0.72)]">
      {children}
    </div>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  if (name.length <= 2) return `${name[0] ?? '*'}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

function getSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

async function getCurrentUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

async function getBillingSnapshot(email?: string | null): Promise<BillingSnapshot> {
  if (!email) {
    return {
      hasCustomer: false,
      isVip: false,
      planName: 'Free',
      statusLabel: 'Not signed in',
      customerId: null,
      subscriptionId: null,
      currentPeriodEnd: null,
      allowanceText: '20 total lifetime chats',
      petText: 'Up to 2 pets',
    };
  }

  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  const customer = customers.data[0];

  if (!customer) {
    return {
      hasCustomer: false,
      isVip: false,
      planName: 'Free',
      statusLabel: 'No Stripe customer yet',
      customerId: null,
      subscriptionId: null,
      currentPeriodEnd: null,
      allowanceText: '20 total lifetime chats',
      petText: 'Up to 2 pets',
    };
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'all',
    limit: 10,
  });

  const preferred =
    subscriptions.data.find((sub) =>
      ['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status)
    ) ??
    subscriptions.data.find((sub) => sub.status !== 'canceled') ??
    subscriptions.data[0];

  if (!preferred) {
    return {
      hasCustomer: true,
      isVip: false,
      planName: 'Free',
      statusLabel: 'No active subscription',
      customerId: customer.id,
      subscriptionId: null,
      currentPeriodEnd: null,
      allowanceText: '20 total lifetime chats',
      petText: 'Up to 2 pets',
    };
  }

  const isVip = ['active', 'trialing', 'past_due'].includes(preferred.status);

  return {
    hasCustomer: true,
    isVip,
    planName: isVip ? 'VIP Membership' : 'Free Plan',
    statusLabel: preferred.status.replaceAll('_', ' '),
    customerId: customer.id,
    subscriptionId: preferred.id,
    currentPeriodEnd: preferred.current_period_end
      ? new Date(preferred.current_period_end * 1000).toISOString()
      : null,
    allowanceText: isVip ? 'Unlimited chats' : '20 total lifetime chats',
    petText: isVip ? 'More than 2 pets' : 'Up to 2 pets',
  };
}

async function startVipCheckout() {
  'use server';

  if (!STRIPE_VIP_PRICE_ID) {
    throw new Error('Missing STRIPE_PRICE_VIP_MONTHLY env var');
  }

  const user = await getCurrentUser();

  if (!user || !user.email) {
    redirect('/login?next=/account');
  }

  const customer = await getOrCreateStripeCustomer({
    email: user.email,
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email.split('@')[0],
    supabaseUserId: user.id,
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [
      {
        price: STRIPE_VIP_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${APP_URL}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      supabase_user_id: user.id,
      app_plan: 'vip',
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        app_plan: 'vip',
      },
    },
  });

  if (!session.url) {
    throw new Error('Stripe checkout url not created');
  }

  redirect(session.url);
}

async function openBillingPortal() {
  'use server';

  const user = await getCurrentUser();

  if (!user || !user.email) {
    redirect('/login?next=/account');
  }

  const customer = await getOrCreateStripeCustomer({
    email: user.email,
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email.split('@')[0],
    supabaseUserId: user.id,
  });

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${APP_URL}/account`,
  });

  redirect(session.url);
}

async function signOutAction() {
  'use server';

  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await getCurrentUser();

  if (!user || !user.email) {
    redirect('/login?next=/account');
  }

  const billing = await getBillingSnapshot(user.email);

  const checkoutSuccess =
    typeof searchParams?.checkout === 'string' &&
    searchParams.checkout === 'success';

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email.split('@')[0];

  const appMetadata = user.app_metadata || {};

  return (
    <div className="min-h-screen bg-[#090505] text-[#fff5ee]">
      <SiteHeader />

      <main className="page-shell page-header-offset page-section-gap">
        <section className="relative overflow-hidden rounded-[32px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(19,10,8,0.96),rgba(11,6,5,0.96))] px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.28)] md:px-8 md:py-10 xl:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,145,51,0.12),transparent_24%),radial-gradient(circle_at_88%_20%,rgba(255,128,64,0.08),transparent_22%)]"
          />

          <div className="relative z-10 max-w-4xl">
            <SectionTag>My Account</SectionTag>

            <h1 className="mt-5 font-display text-[42px] leading-[0.98] tracking-[-0.04em] text-[#fff7f1] sm:text-[52px] md:text-[64px]">
              Welcome back, {displayName}
            </h1>

            <p className="mt-5 max-w-3xl text-[15px] leading-8 text-[rgba(255,239,231,0.76)] md:text-[16px]">
              Review your current membership, billing status, Stripe customer
              linkage, and self-service subscription controls in one warm,
              unified space.
            </p>

            {checkoutSuccess ? (
              <div className="mt-6 rounded-2xl border border-[rgba(255,206,140,0.18)] bg-[rgba(255,187,120,0.08)] px-4 py-3 text-sm text-[#f4d2ad]">
                Checkout completed. If Stripe has already confirmed payment, your
                VIP status should appear here shortly.
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[30px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(19,10,8,0.96),rgba(11,6,5,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[32px] tracking-[-0.03em] text-[#fff7f1]">
                Account Status
              </h2>
              <span className="rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[12px] text-[rgba(255,239,231,0.74)]">
                {billing.planName}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[22px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[rgba(255,224,206,0.44)]">
                  Email
                </div>
                <div className="mt-3 text-sm font-semibold text-[#fff7f1]">
                  {maskEmail(user.email)}
                </div>
                <div className="mt-2 text-xs text-[rgba(255,239,231,0.48)]">
                  Full email hidden for privacy
                </div>
              </div>

              <div className="rounded-[22px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[rgba(255,224,206,0.44)]">
                  Current Plan
                </div>
                <div className="mt-3 text-sm font-semibold text-[#fff7f1]">
                  {billing.planName}
                </div>
                <div className="mt-2 text-xs text-[rgba(255,239,231,0.48)]">
                  {billing.statusLabel}
                </div>
              </div>

              <div className="rounded-[22px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[rgba(255,224,206,0.44)]">
                  Pets
                </div>
                <div className="mt-3 text-sm font-semibold text-[#fff7f1]">
                  {billing.petText}
                </div>
                <div className="mt-2 text-xs text-[rgba(255,239,231,0.48)]">
                  Based on your current plan
                </div>
              </div>

              <div className="rounded-[22px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[rgba(255,224,206,0.44)]">
                  Chat Allowance
                </div>
                <div className="mt-3 text-sm font-semibold text-[#fff7f1]">
                  {billing.allowanceText}
                </div>
                <div className="mt-2 text-xs text-[rgba(255,239,231,0.48)]">
                  {billing.isVip ? 'VIP plan active' : 'Free plan snapshot'}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-[rgba(255,233,220,0.12)] bg-[rgba(255,191,120,0.06)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f3c28e]">
                Billing Snapshot
              </div>

              <div className="mt-3 grid gap-2 text-sm text-[rgba(255,239,231,0.82)]">
                <div>
                  Stripe customer:{' '}
                  <span className="text-[#fff7f1]">
                    {billing.customerId ?? 'Not created yet'}
                  </span>
                </div>
                <div>
                  Subscription:{' '}
                  <span className="text-[#fff7f1]">
                    {billing.subscriptionId ?? 'No active subscription'}
                  </span>
                </div>
                <div>
                  Renewal / current period end:{' '}
                  <span className="text-[#fff7f1]">
                    {formatDate(billing.currentPeriodEnd)}
                  </span>
                </div>
                <div>
                  Supabase app metadata billing status:{' '}
                  <span className="text-[#fff7f1]">
                    {String(appMetadata.billing_status ?? 'not synced yet')}
                  </span>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(19,10,8,0.96),rgba(11,6,5,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[32px] tracking-[-0.03em] text-[#fff7f1]">
                Membership &amp; Security
              </h2>
              <span className="rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[12px] text-[rgba(255,239,231,0.74)]">
                Quick Actions
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <form action={openBillingPortal}>
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
                >
                  Manage Subscription
                </button>
              </form>

              {!billing.isVip ? (
                <form action={startVipCheckout}>
                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-5 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.32)]"
                  >
                    Upgrade to VIP
                  </button>
                </form>
              ) : null}

              <Link
                href="/chat"
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
              >
                Manage Pets &amp; Continue Chat
              </Link>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
                >
                  Sign Out Securely
                </button>
              </form>
            </div>

            <div className="mt-5 rounded-[22px] border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-[rgba(255,239,231,0.72)]">
              If you just upgraded, your VIP status may take a moment to appear
              here after Stripe confirms checkout and the webhook updates your
              account metadata.
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[30px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(19,10,8,0.96),rgba(11,6,5,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:p-7">
            <div className="text-sm text-[rgba(255,224,206,0.66)]">Free plan</div>
            <h3 className="mt-2 font-display text-[34px] tracking-[-0.03em] text-[#fff7f1]">
              What Free includes
            </h3>

            <div className="mt-6 space-y-3 text-sm text-[rgba(255,239,231,0.84)]">
              <div>✓ 20 total lifetime chats</div>
              <div>✓ Up to 2 pets</div>
              <div>✓ Basic memory capability</div>
              <div>✓ Pet profile and photo upload</div>
            </div>
          </article>

          <article className="rounded-[30px] border border-[rgba(255,191,120,0.18)] bg-[linear-gradient(180deg,rgba(28,13,10,0.98),rgba(14,7,6,0.98))] p-6 shadow-[0_24px_80px_rgba(255,125,40,0.10)] md:p-7">
            <div className="text-sm text-[rgba(255,224,206,0.66)]">VIP membership</div>
            <h3 className="mt-2 font-display text-[34px] tracking-[-0.03em] text-[#fff7f1]">
              What VIP unlocks
            </h3>

            <div className="mt-3 flex items-end gap-1">
              <span className="text-[44px] font-semibold leading-none text-[#fff7f1]">$9.99</span>
              <span className="pb-1 text-sm text-[rgba(255,224,206,0.56)]">/ month</span>
            </div>

            <div className="mt-6 space-y-3 text-sm text-[rgba(255,239,231,0.84)]">
              <div>✓ Unlimited chats</div>
              <div>✓ More than 2 pets</div>
              <div>✓ Deeper long-term memory</div>
              <div>✓ Richer emotional continuity</div>
              <div>✓ Access via Stripe Checkout + Billing Portal</div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
