'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

function encodeMessage(value: string) {
  return encodeURIComponent(value);
}

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

  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      redirect(buildLoginRedirect({ error: error.message }));
    }

    if (!data?.url) {
      redirect(buildLoginRedirect({ error: 'Google sign-in could not be started.' }));
    }

    redirect(data.url);
  } catch {
    redirect(buildLoginRedirect({ error: 'Unexpected Google sign-in error.' }));
  }
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

  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(buildLoginRedirect({ error: error.message }));
    }

    redirect('/create-pet');
  } catch {
    redirect(buildLoginRedirect({ error: 'Unexpected sign-in error.' }));
  }
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

  try {
    const supabase = createServerSupabaseClient();

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

    if (data.session) {
      redirect('/create-pet');
    }

    redirect(
      buildLoginRedirect({
        message: 'Account created. Please check your email to confirm your sign-in.',
      }),
    );
  } catch {
    redirect(buildLoginRedirect({ error: 'Unexpected sign-up error.' }));
  }
}
