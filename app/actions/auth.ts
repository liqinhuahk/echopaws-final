'use server';

import { redirect } from 'next/navigation';
import {
  createServerSupabaseClient,
  hasSupabaseEnv,
} from '@/lib/supabase/server';

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

function stripWrappingQuotes(value: string) {
  return value.replace(/^['"`\s]+|['"`\s]+$/g, '');
}

function normalizeBaseUrl(rawValue?: string) {
  const raw = stripWrappingQuotes(rawValue ?? '');

  if (!raw) {
    return null;
  }

  const withProtocol =
    raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return null;
  }
}

function getSiteUrl() {
  const explicit =
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeBaseUrl(process.env.SITE_URL);

  if (explicit) {
    return explicit;
  }

  const vercelUrl = stripWrappingQuotes(process.env.VERCEL_URL ?? '');
  if (vercelUrl) {
    const normalizedVercel = normalizeBaseUrl(`https://${vercelUrl}`);
    if (normalizedVercel) {
      return normalizedVercel;
    }
  }

  return 'http://localhost:3000';
}

function toSafeString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : '';
}

function sanitizeEmail(value: FormDataEntryValue | null) {
  return toSafeString(value).trim().toLowerCase();
}

function sanitizePassword(value: FormDataEntryValue | null) {
  return toSafeString(value);
}

function sanitizeNickname(value: FormDataEntryValue | null) {
  return toSafeString(value).trim().slice(0, 80);
}

function toFriendlyAuthError(message: string, fallback: string) {
  const raw = message.trim();
  if (!raw) return fallback;

  const lowered = raw.toLowerCase();

  if (
    lowered.includes('invalid login credentials') ||
    lowered.includes('invalid credentials')
  ) {
    return 'Incorrect email or password.';
  }

  if (lowered.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }

  if (lowered.includes('user already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }

  if (lowered.includes('password should be at least')) {
    return raw;
  }

  if (lowered.includes('unable to validate email address')) {
    return 'Please enter a valid email address.';
  }

  if (lowered.includes('signup is disabled')) {
    return 'Email sign-up is currently disabled.';
  }

  if (
    lowered.includes('provider is not enabled') ||
    lowered.includes('unsupported provider')
  ) {
    return 'Google sign-in is not enabled yet in Supabase.';
  }

  if (
    lowered.includes('redirect url') ||
    lowered.includes('redirect_to') ||
    lowered.includes('invalid redirect')
  ) {
    return 'Auth redirect URL is not configured correctly. Please check Supabase URL Configuration and NEXT_PUBLIC_SITE_URL.';
  }

  return raw;
}

function redirectToLoginError(message: string) {
  redirect(buildLoginRedirect({ error: message }));
}

function redirectToLoginMessage(message: string) {
  redirect(buildLoginRedirect({ message }));
}

export async function signInWithGoogle() {
  if (!hasSupabaseEnv()) {
    redirectToLoginError('Please configure Supabase Auth first.');
  }

  const supabase = createServerSupabaseClient();
  const siteUrl = getSiteUrl();

  let oauthUrl: string | null = null;
  let oauthError: string | null = null;

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      oauthError = toFriendlyAuthError(
        error.message,
        'Google sign-in could not be started.',
      );
    } else if (!data?.url) {
      oauthError = 'Google sign-in could not be started.';
    } else {
      oauthUrl = data.url;
    }
  } catch (error) {
    oauthError = toFriendlyAuthError(
      error instanceof Error ? error.message : '',
      'Google sign-in is unavailable. Please try again later.',
    );
  }

  if (oauthError) {
    redirectToLoginError(oauthError);
  }

  redirect(oauthUrl!);
}

export async function signInWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirectToLoginError('Please configure Supabase Auth first.');
  }

  const email = sanitizeEmail(formData.get('email'));
  const password = sanitizePassword(formData.get('password'));

  if (!email || !password) {
    redirectToLoginError('Please enter both email and password.');
  }

  const supabase = createServerSupabaseClient();

  let signInError: string | null = null;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      signInError = toFriendlyAuthError(
        error.message,
        'Sign-in failed. Please try again.',
      );
    }
  } catch (error) {
    signInError = toFriendlyAuthError(
      error instanceof Error ? error.message : '',
      'Sign-in is unavailable. Please try again later.',
    );
  }

  if (signInError) {
    redirectToLoginError(signInError);
  }

  redirect('/create-pet');
}

export async function signUpWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirectToLoginError('Please configure Supabase Auth first.');
  }

  const email = sanitizeEmail(formData.get('email'));
  const password = sanitizePassword(formData.get('password'));
  const nickname = sanitizeNickname(formData.get('nickname'));
  const siteUrl = getSiteUrl();

  if (!email || !password) {
    redirectToLoginError('Please enter both email and password.');
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
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      signUpError = toFriendlyAuthError(
        error.message,
        'Sign-up failed. Please try again.',
      );
    } else if (data.session) {
      hasSession = true;
    }
  } catch (error) {
    signUpError = toFriendlyAuthError(
      error instanceof Error ? error.message : '',
      'Sign-up is unavailable. Please try again later.',
    );
  }

  if (signUpError) {
    redirectToLoginError(signUpError);
  }

  if (hasSession) {
    redirect('/create-pet');
  }

  redirectToLoginMessage(
    'Account created. Please check your email to confirm your sign-in.',
  );
}

export async function signOut() {
  if (!hasSupabaseEnv()) {
    redirect('/login');
  }

  const supabase = createServerSupabaseClient();

  try {
    await supabase.auth.signOut();
  } catch {
    // 即使 signOut 失败，也尽量把用户送回登录页
  }

  redirect(buildLoginRedirect({ message: 'You have been signed out.' }));
}
