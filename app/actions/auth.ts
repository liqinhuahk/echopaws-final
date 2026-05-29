'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

function buildLoginRedirect(params: { message?: string; error?: string }) {
  const search = new URLSearchParams();

  if (params.message) {
    search.set('message', params.message);
  }

  if (params.error) {
    search.set('error', params.error);
  }

  const query = search.toString();
  return query ? `/login?${query}` : '/login';
}

function getSiteUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL;

  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

export async function signInWithGoogle() {
  if (!hasSupabaseEnv()) {
    redirect(buildLoginRedirect({ error: 'Please configure Supabase Auth first.' }));
  }

  const supabase = createServerSupabaseClient();

  let oauthData:
    | {
        url?: string;
      }
    | undefined;

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      redirect(buildLoginRedirect({ error: error.message }));
    }

    oauthData = data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected Google sign-in error.';
    redirect(buildLoginRedirect({ error: message }));
  }

  if (!oauthData?.url) {
    redirect(buildLoginRedirect({ error: 'Google sign-in could not be started.' }));
  }

  redirect(oauthData.url);
}

export async function signInWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(buildLoginRedirect({ error: 'Please configure Supabase Auth first.' }));
  }

  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    redirect(buildLoginRedirect({ error: 'Please enter both email and password.' }));
  }

  const supabase = createServerSupabaseClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(buildLoginRedirect({ error: error.message }));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected sign-in error.';
    redirect(buildLoginRedirect({ error: message }));
  }

  redirect('/create-pet');
}

export async function signUpWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(buildLoginRedirect({ error: 'Please configure Supabase Auth first.' }));
  }

  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const nickname = String(formData.get('nickname') || '').trim();

  if (!email || !password) {
    redirect(buildLoginRedirect({ error: 'Please enter both email and password.' }));
  }

  const supabase = createServerSupabaseClient();

  let signUpResult:
    | {
        session: unknown | null;
      }
    | undefined;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: nickname ? { nickname } : undefined,
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      redirect(buildLoginRedirect({ error: error.message }));
    }

    signUpResult = data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected sign-up error.';
    redirect(buildLoginRedirect({ error: message }));
  }

  if (signUpResult?.session) {
    redirect('/create-pet');
  }

  redirect(
    buildLoginRedirect({
      message: 'Account created. Please check your email to confirm your sign-in.',
    }),
  );
}
