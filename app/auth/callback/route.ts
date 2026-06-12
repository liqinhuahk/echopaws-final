import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function getSafeNextPath(raw: string | null) {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

function buildLoginReturnUrl(request: NextRequest, params: {
  nextPath: string;
  auth?: string;
  oauth: 'done' | 'error';
  message?: string;
}) {
  const url = new URL('/login', request.url);
  url.searchParams.set('next', params.nextPath);
  if (params.auth) url.searchParams.set('auth', params.auth);
  url.searchParams.set('oauth', params.oauth);
  if (params.message) url.searchParams.set('message', params.message);
  return url;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const code = request.nextUrl.searchParams.get('code');
  const auth = request.nextUrl.searchParams.get('auth') || 'google';
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get('next'));

  const oauthError = request.nextUrl.searchParams.get('error');
  const oauthErrorDescription =
    request.nextUrl.searchParams.get('error_description') ||
    request.nextUrl.searchParams.get('error_code');

  if (oauthError) {
    return NextResponse.redirect(
      buildLoginReturnUrl(request, {
        nextPath,
        auth,
        oauth: 'error',
        message: oauthErrorDescription || oauthError,
      })
    );
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      buildLoginReturnUrl(request, {
        nextPath,
        auth,
        oauth: 'error',
        message: 'Missing Supabase public environment variables',
      })
    );
  }

  if (!code) {
    return NextResponse.redirect(
      buildLoginReturnUrl(request, {
        nextPath,
        auth,
        oauth: 'error',
        message: 'Missing OAuth code',
      })
    );
  }

  let response = NextResponse.redirect(
    buildLoginReturnUrl(request, {
      nextPath,
      auth,
      oauth: 'done',
    })
  );

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: any) {
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        buildLoginReturnUrl(request, {
          nextPath,
          auth,
          oauth: 'error',
          message: error.message || 'Failed to exchange code for session',
        })
      );
    }

    return response;
  } catch (error) {
    return NextResponse.redirect(
      buildLoginReturnUrl(request, {
        nextPath,
        auth,
        oauth: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to complete Google sign-in',
      })
    );
  }
}
