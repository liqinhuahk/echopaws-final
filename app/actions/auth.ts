'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

function buildLoginRedirect(params: { message?: string; error?: string }) {
  const search = new URLSearchParams();

  if (params.message) search.set('message', params.message);
  if (params.error) search.set('error', params.error);

  const query = search.toString();
  return query ? `/login?${query}` : '/login';
}

function getSiteUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL;

  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return 'http://localhost:3000';
}

export async function signInWithGoogle() {
  if (!hasSupabaseEnv()) {
    redirect(buildLoginRedirect({ error: 'Please configure Supabase Auth first.' }));
  }

  const supabase = createServerSupabaseClient();

  let oauthUrl: string | null = null;
  let oauthError: string | null = null;

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      oauthError = error.message;
    } else if (!data?.url) {
      oauthError = 'Google sign-in could not be started.';
    } else {
      oauthUrl = data.url;
    }
  } catch {
    oauthError = 'Google sign-in is unavailable. Please try again later.';
  }

  if (oauthError) {
    redirect(buildLoginRedirect({ error: oauthError }));
  }

  redirect(oauthUrl!);
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

  let signInError: string | null = null;

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      signInError = error.message;
    }
  } catch {
    signInError = 'Sign-in is unavailable. Please try again later.';
  }

  if (signInError) {
    redirect(buildLoginRedirect({ error: signInError }));
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

  let signUpError: string | null = null;
  let hasSession = false;

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
      signUpError = error.message;
    } else if (data.session) {
      hasSession = true;
    }
  } catch {
    signUpError = 'Sign-up is unavailable. Please try again later.';
  }

  if (signUpError) {
    redirect(buildLoginRedirect({ error: signUpError }));
  }

  if (hasSession) {
    redirect('/create-pet');
  }

  redirect(
    buildLoginRedirect({
      message: 'Account created. Please check your email to confirm your sign-in.',
    }),
  );
}
