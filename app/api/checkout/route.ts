import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getOrCreateStripeCustomer, STRIPE_VIP_PRICE_ID, stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    if (!STRIPE_VIP_PRICE_ID) {
      return NextResponse.json(
        { error: 'Missing STRIPE_PRICE_VIP_MONTHLY env var' },
        { status: 500 }
      );
    }

    const cookieStore = cookies();

    const supabase = createServerClient(
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://beta.echopaws.ai';

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
      success_url: `${origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        supabase_user_id: user.id,
        app_plan: 'vip',
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe checkout url not created' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[stripe checkout]', error);
    return NextResponse.json(
      { error: 'Unable to create Stripe Checkout session' },
      { status: 500 }
    );
  }
}
