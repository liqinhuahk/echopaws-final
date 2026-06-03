'use client';

import { createBrowserClient } from '@supabase/ssr';

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

export function getBrowserSupabaseConfig() {
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

export function createBrowserSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getBrowserSupabaseConfig();

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
