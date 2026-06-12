import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const STRIPE_VIP_PRICE_ID = process.env.STRIPE_PRICE_VIP_MONTHLY || '';

export async function getOrCreateStripeCustomer(params: {
  email: string;
  name?: string | null;
  supabaseUserId?: string;
}) {
  const { email, name, supabaseUserId } = params;

  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  return stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: supabaseUserId
      ? {
          supabase_user_id: supabaseUserId,
        }
      : undefined,
  });
}
