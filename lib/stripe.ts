import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function hasStripeEnv() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_VIP_MONTHLY);
}

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    });
  }

  return stripeClient;
}

export function getSiteUrl() {
  const raw = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    'http://localhost:3000'
  ).trim();

  const normalized = raw.replace(/^['"]|['"]$/g, '');

  const withProtocol =
    normalized.startsWith('http://') || normalized.startsWith('https://')
      ? normalized
      : `https://${normalized}`;

  return withProtocol.replace(/\/$/, '');
}
