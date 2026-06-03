import { NextRequest, NextResponse } from 'next/server';
import {
  createServerSupabaseClient,
  hasSupabaseEnv,
} from '@/lib/supabase/server';

function sanitizeNextPath(value: string | null | undefined, fallback = '/account') {
  const raw = (value ?? '').trim();

  if (!raw) return fallback;

  // 只允许站内相对路径，避免 open redirect
  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//')) return fallback;

  return raw;
}

function buildAbsoluteUrl(request: NextRequest, path: string) {
  return new URL(path, request.nextUrl.origin);
}

function buildLoginRedirect(
  request: NextRequest,
  params: { message?: string; error?: string },
) {
  const search = new URLSearchParams();

  if (params.message) {
    search.set('message', params.message);
  }

  if (params.error) {
    search.set('error', params.error);
  }

  const query = search.toString();
  const pathname = query ? `/login?${query}` : '/login';

  return buildAbsoluteUrl(request, pathname);
}

function toFriendlyCallbackError(message: string, fallback: string) {
  const raw = message.trim();
  if (!raw) return fallback;

  const lowered = raw.toLowerCase();

  if (
    lowered.includes('invalid_grant') ||
    lowered.includes('bad_oauth_state') ||
    lowered.includes('oauth') ||
    lowered.includes('code verifier')
  ) {
    return 'Google sign-in session expired or is invalid. Please try again.';
  }

  if (
    lowered.includes('redirect') ||
    lowered.includes('redirect_to') ||
    lowered.includes('invalid redirect')
  ) {
    return 'Auth redirect URL is not configured correctly. Please check Supabase URL Configuration and NEXT_PUBLIC_SITE_URL.';
  }

  if (
    lowered.includes('provider') &&
    (lowered.includes('disabled') || lowered.includes('not enabled'))
  ) {
    return 'Google sign-in is not enabled yet in Supabase.';
  }

  return raw || fallback;
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get('code');
  const next = sanitizeNextPath(
    requestUrl.searchParams.get('next'),
    '/account',
  );

  const providerError =
    requestUrl.searchParams.get('error_description') ||
    requestUrl.searchParams.get('error') ||
    requestUrl.searchParams.get('error_code');

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(
      buildLoginRedirect(request, {
        error: 'Please configure Supabase environment variables first.',
      }),
    );
  }

  if (providerError) {
    return NextResponse.redirect(
      buildLoginRedirect(request, {
        error: toFriendlyCallbackError(
          providerError,
          'Google sign-in failed. Please try again.',
        ),
      }),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      buildLoginRedirect(request, {
        error: 'Missing auth code. Please try signing in again.',
      }),
    );
  }

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        buildLoginRedirect(request, {
          error: toFriendlyCallbackError(
            error.message,
            'Could not complete sign-in. Please try again.',
          ),
        }),
      );
    }
  } catch (error) {
    return NextResponse.redirect(
      buildLoginRedirect(request, {
        error: toFriendlyCallbackError(
          error instanceof Error ? error.message : '',
          'Could not complete sign-in. Please try again.',
        ),
      }),
    );
  }

  return NextResponse.redirect(buildAbsoluteUrl(request, next));
}
