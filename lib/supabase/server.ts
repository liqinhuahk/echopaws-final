import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function stripWrappingQuotes(value: string) {
  return value.replace(/^['"`\s]+|['"`\s]+$/g, '');
}

function normalizeSupabaseUrl(rawValue?: string) {
  const raw = stripWrappingQuotes(rawValue ?? '');

  if (!raw) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL. Please set it in Vercel or .env.local.',
    );
  }

  const withProtocol =
    raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`;

  let parsed: URL;

  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${raw}". Expected format like https://your-project-ref.supabase.co`,
    );
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL protocol: "${parsed.protocol}". Only http/https are allowed.`,
    );
  }

  if (!parsed.hostname) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${raw}". Missing hostname.`,
    );
  }

  return parsed.origin;
}

function normalizeSupabaseAnonKey(rawValue?: string) {
  const raw = stripWrappingQuotes(rawValue ?? '');

  if (!raw) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Please set it in Vercel or .env.local.',
    );
  }

  return raw;
}

export function getServerSupabaseConfig() {
  const supabaseUrl = normalizeSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const supabaseAnonKey = normalizeSupabaseAnonKey(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function hasSupabaseEnv() {
  try {
    getServerSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}

export function createServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getServerSupabaseConfig();
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignore cookie writes in server components / restricted runtimes.
        }
      },
    },
  });
}
