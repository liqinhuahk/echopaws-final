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
  renewalText: string;
  customerId: string | null;
};

function CheckIcon() {
  return <span className="text-[#f4bb72]">✓</span>;
}

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

function maskPriceId(value: string) {
  if (!value) return 'Not configured';
  if (value.length <= 12) return value;
  return `${value.slice(0, 10)}...${value.slice(-4)}`;
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
      renewalText: 'Sign in to manage billing',
      customerId: null,
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
      renewalText: 'Upgrade anytime',
      customerId: null,
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
      renewalText: 'Upgrade anytime',
      customerId: customer.id,
    };
  }

  const isVip = ['active', 'trialing', 'past_due'].includes(preferred.status);
  const currentPeriodEnd = preferred.current_period_end
    ? new Date(preferred.current_period_end * 1000).toISOString()
    : null;

  return {
    hasCustomer: true,
    isVip,
    planName: isVip ? 'VIP' : 'Free',
    statusLabel: preferred.status.replaceAll('_', ' '),
    renewalText: isVip
      ? `Renews / updates: ${formatDate(currentPeriodEnd)}`
      : 'Upgrade anytime',
    customerId: customer.id,
  };
}

async function startVipCheckout() {
  'use server';

  if (!STRIPE_VIP_PRICE_ID) {
    throw new Error('Missing STRIPE_PRICE_VIP_MONTHLY env var');
  }

  const user = await getCurrentUser();

  if (!user || !user.email) {
    redirect('/login?next=/pricing');
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

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await getCurrentUser();
  const billing = await getBillingSnapshot(user?.email);

  const checkoutCancelled =
    typeof searchParams?.checkout === 'string' &&
    searchParams.checkout === 'cancelled';

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
            <SectionTag>Pricing</SectionTag>

            <h1 className="mt-5 font-display text-[42px] leading-[0.98] tracking-[-0.04em] text-[#fff7f1] sm:text-[52px] md:text-[64px]">
              Choose the amount of room you want to stay connected.
            </h1>

            <p className="mt-5 max-w-3xl text-[15px] leading-8 text-[rgba(255,239,231,0.76)] md:text-[16px]">
              Start gently with Free, or unlock uninterrupted conversations,
              richer emotional continuity, and more pet capacity with VIP.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-[12px] text-[rgba(255,224,206,0.7)]">
              <span className="rounded-full border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                VIP Stripe Price ID: {maskPriceId(STRIPE_VIP_PRICE_ID)}
              </span>
              {user ? (
                <span className="rounded-full border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                  Current plan: {billing.planName}
                </span>
              ) : (
                <span className="rounded-full border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                  Sign in to start checkout
                </span>
              )}
            </div>

            {checkoutCancelled ? (
              <div className="mt-6 rounded-2xl border border-[rgba(255,206,140,0.18)] bg-[rgba(255,187,120,0.08)] px-4 py-3 text-sm text-[#f4d2ad]">
                Checkout was cancelled. Your plan has not changed.
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[30px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(19,10,8,0.96),rgba(11,6,5,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:p-7">
            <div className="text-sm text-[rgba(255,224,206,0.66)]">Free plan</div>
            <div className="mt-2 text-[34px] font-semibold text-[#fff7f1]">Free</div>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-[44px] font-semibold leading-none text-[#fff7f1]">$0</span>
              <span className="pb-1 text-sm text-[rgba(255,224,206,0.56)]">/ forever</span>
            </div>

            <p className="mt-5 max-w-lg text-[14px] leading-7 text-[rgba(255,239,231,0.7)]">
              A gentle starting point for first-time users who want to explore
              EchoPaws before upgrading.
            </p>

            <div className="mt-6 space-y-3 text-sm text-[rgba(255,239,231,0.84)]">
              <div className="flex items-center gap-3"><CheckIcon /> 20 lifetime chats</div>
              <div className="flex items-center gap-3"><CheckIcon /> Up to 2 pets</div>
              <div className="flex items-center gap-3"><CheckIcon /> Basic memory capability</div>
              <div className="flex items-center gap-3"><CheckIcon /> Pet profile and photo upload</div>
            </div>

            <div className="mt-8">
              {user ? (
                <Link
                  href="/chat"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
                >
                  Continue with Free
                </Link>
              ) : (
                <Link
                  href="/login?next=/pricing"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
                >
                  Sign In to Start
                </Link>
              )}
            </div>
          </article>

          <article className="relative rounded-[30px] border border-[rgba(255,191,120,0.18)] bg-[linear-gradient(180deg,rgba(28,13,10,0.98),rgba(14,7,6,0.98))] p-6 shadow-[0_24px_80px_rgba(255,125,40,0.10)] md:p-7">
            <div className="absolute right-5 top-5 rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] font-medium text-[rgba(255,239,231,0.75)]">
              Recommended
            </div>

            <div className="text-sm text-[rgba(255,224,206,0.66)]">VIP membership</div>
            <div className="mt-2 text-[34px] font-semibold text-[#fff7f1]">VIP</div>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-[44px] font-semibold leading-none text-[#fff7f1]">$9.99</span>
              <span className="pb-1 text-sm text-[rgba(255,224,206,0.56)]">/ month</span>
            </div>

            <p className="mt-5 max-w-lg text-[14px] leading-7 text-[rgba(255,239,231,0.7)]">
              Best for users who want uninterrupted companionship, deeper
              memory, and more pet capacity.
            </p>

            <div className="mt-6 space-y-3 text-sm text-[rgba(255,239,231,0.84)]">
              <div className="flex items-center gap-3"><CheckIcon /> Unlimited chats</div>
              <div className="flex items-center gap-3"><CheckIcon /> More than 2 pets</div>
              <div className="flex items-center gap-3"><CheckIcon /> Deeper long-term memory</div>
              <div className="flex items-center gap-3"><CheckIcon /> Richer emotional continuity</div>
              <div className="flex items-center gap-3"><CheckIcon /> Priority access to future voice features</div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {billing.isVip ? (
                <form action={openBillingPortal}>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-5 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.32)]"
                  >
                    Manage VIP
                  </button>
                </form>
              ) : (
                <form action={startVipCheckout}>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-5 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.32)]"
                  >
                    Upgrade to VIP
                  </button>
                </form>
              )}

              {billing.hasCustomer ? (
                <span className="text-xs text-[rgba(255,224,206,0.58)]">
                  {billing.statusLabel} · {billing.renewalText}
                </span>
              ) : null}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-[30px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(19,10,8,0.96),rgba(11,6,5,0.96))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:p-6">
          <h2 className="font-display text-[32px] tracking-[-0.03em] text-[#fff7f1]">
            Plan comparison
          </h2>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-[rgba(255,233,220,0.1)]">
            <div className="grid grid-cols-3 border-b border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.02)] text-sm font-medium text-[rgba(255,239,231,0.8)]">
              <div className="px-4 py-4">Feature</div>
              <div className="px-4 py-4">Free</div>
              <div className="px-4 py-4">VIP</div>
            </div>

            {[
              ['Price', '$0 forever', '$9.99 / month'],
              ['Chats', '20 lifetime chats', 'Unlimited chats'],
              ['Pet capacity', 'Up to 2 pets', 'More than 2 pets'],
              ['Memory depth', 'Basic', 'Deeper long-term memory'],
              ['Emotional continuity', 'Standard', 'Richer continuity'],
              ['Billing tools', '—', 'Stripe checkout + billing portal'],
            ].map((row) => (
              <div
                key={row[0]}
                className="grid grid-cols-3 border-b border-[rgba(255,233,220,0.08)] text-sm text-[rgba(255,239,231,0.78)] last:border-b-0"
              >
                <div className="px-4 py-4 font-medium text-[#fff5ee]">{row[0]}</div>
                <div className="px-4 py-4">{row[1]}</div>
                <div className="px-4 py-4">{row[2]}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
