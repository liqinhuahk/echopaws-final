import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

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

async function getSupabaseUserIdFromCustomer(
  customerId?: string | null
): Promise<string | null> {
  if (!customerId) return null;

  const customer = await stripe.customers.retrieve(customerId);

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
      `Unable to load Supabase user ${userId}: ${existingUser.error?.message || 'not found'}`
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

async function syncFromCheckoutSession(session: Stripe.Checkout.Session) {
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id;

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

  const userId =
    session.metadata?.supabase_user_id ||
    (await getSupabaseUserIdFromCustomer(customerId));

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
    ? await stripe.subscriptions.retrieve(subscriptionId)
    : null;

  await syncSubscriptionStateToUser({
    userId,
    customerId,
    subscription,
  });
}

async function syncFromSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  const userId =
    subscription.metadata?.supabase_user_id ||
    (await getSupabaseUserIdFromCustomer(customerId));

  if (!userId) {
    console.warn('[stripe webhook] subscription event missing supabase user id', {
      subscriptionId: subscription.id,
      customerId,
    });
    return;
  }

  await syncSubscriptionStateToUser({
