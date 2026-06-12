import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  return new Stripe(secretKey);
}

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET');
  }

  return secret;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isVipStatus(status?: string | null) {
  return ['active', 'trialing', 'past_due'].includes(status ?? '');
}

function normalizeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
) {
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  if ('deleted' in customer && customer.deleted) return null;
  return customer.id;
}

async function getSupabaseUserIdFromCustomer(params: {
  stripeClient: Stripe;
  customerId?: string | null;
}) {
  const { stripeClient, customerId } = params;

  if (!customerId) return null;

  const customer = await stripeClient.customers.retrieve(customerId);

  if ('deleted' in customer && customer.deleted) {
    return null;
  }

  return customer.metadata?.supabase_user_id || null;
}

async function updateUserAppMetadata(
  userId: string,
  patch: Record<string, unknown>
) {
  const supabaseAdmin = getSupabaseAdmin();

  const existingUser = await supabaseAdmin.auth.admin.getUserById(userId);

  if (existingUser.error || !existingUser.data.user) {
    throw new Error(
      `Unable to load Supabase user ${userId}: ${
        existingUser.error?.message || 'not found'
      }`
    );
  }

  const mergedAppMetadata = {
    ...(existingUser.data.user.app_metadata ?? {}),
    ...patch,
  };

  const updated = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: mergedAppMetadata,
  });

  if (updated.error) {
    throw new Error(updated.error.message);
  }
}

async function syncSubscriptionStateToUser(params: {
  userId: string;
  customerId?: string | null;
  subscription?: Stripe.Subscription | null;
}) {
  const { userId, customerId, subscription } = params;

  const patch = {
    stripe_customer_id: customerId ?? null,
    stripe_subscription_id: subscription?.id ?? null,
    stripe_price_id: subscription?.items?.data?.[0]?.price?.id ?? null,
    billing_plan:
      subscription && isVipStatus(subscription.status) ? 'vip' : 'free',
    billing_status: subscription?.status ?? 'free',
    billing_vip:
      subscription && isVipStatus(subscription.status) ? true : false,
    billing_cancel_at_period_end:
      subscription?.cancel_at_period_end ?? false,
    billing_current_period_end:
      subscription?.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    billing_updated_at: new Date().toISOString(),
  };

  await updateUserAppMetadata(userId, patch);
}

async function syncFromCheckoutSession(params: {
  stripeClient: Stripe;
  session: Stripe.Checkout.Session;
}) {
  const { stripeClient, session } = params;

  const customerId = normalizeCustomerId(session.customer);
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

  const userId =
    session.metadata?.supabase_user_id ||
    (await getSupabaseUserIdFromCustomer({
      stripeClient,
      customerId,
    }));

  if (!userId) {
    console.warn(
      '[stripe webhook] checkout.session.completed missing supabase user id',
      {
        checkoutSessionId: session.id,
        customerId,
      }
    );
    return;
  }

  const subscription = subscriptionId
    ? await stripeClient.subscriptions.retrieve(subscriptionId)
    : null;

  await syncSubscriptionStateToUser({
    userId,
    customerId,
    subscription,
  });
}

async function syncFromSubscription(params: {
  stripeClient: Stripe;
  subscription: Stripe.Subscription;
}) {
  const { stripeClient, subscription } = params;

  const customerId = normalizeCustomerId(subscription.customer);

  const userId =
    subscription.metadata?.supabase_user_id ||
    (await getSupabaseUserIdFromCustomer({
      stripeClient,
      customerId,
    }));

  if (!userId) {
    console.warn('[stripe webhook] subscription event missing supabase user id', {
      subscriptionId: subscription.id,
      customerId,
    });
    return;
  }

  await syncSubscriptionStateToUser({
    userId,
    customerId,
    subscription,
  });
}

async function syncFromInvoice(params: {
  stripeClient: Stripe;
  invoice: Stripe.Invoice;
}) {
  const { stripeClient, invoice } = params;

  const customerId = normalizeCustomerId(invoice.customer);

  if (!customerId) {
    return;
  }

  const userId = await getSupabaseUserIdFromCustomer({
    stripeClient,
    customerId,
  });

  if (!userId) {
    console.warn('[stripe webhook] invoice event missing supabase user id', {
      invoiceId: invoice.id,
      customerId,
    });
    return;
  }

  let subscription: Stripe.Subscription | null = null;

  const invoiceSubscription =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id ?? null;

  if (invoiceSubscription) {
    subscription = await stripeClient.subscriptions.retrieve(invoiceSubscription);
  } else {
    const subscriptions = await stripeClient.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    });

    subscription = subscriptions.data[0] ?? null;
  }

  await syncSubscriptionStateToUser({
    userId,
    customerId,
    subscription,
  });
}

export async function POST(request: Request) {
  try {
    const stripeClient = getStripeClient();
    const webhookSecret = getWebhookSecret();

    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    let event: Stripe.Event;

    try {
      event = stripeClient.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Webhook signature verification failed';

      console.error('[stripe webhook] signature verification failed', message);

      return NextResponse.json({ error: message }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await syncFromCheckoutSession({
          stripeClient,
          session,
        });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncFromSubscription({
          stripeClient,
          subscription,
        });
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await syncFromInvoice({
          stripeClient,
          invoice,
        });
        break;
      }

      default: {
        console.log('[stripe webhook] ignored event type:', event.type);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown webhook error';

    console.error('[stripe webhook] fatal error', message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
