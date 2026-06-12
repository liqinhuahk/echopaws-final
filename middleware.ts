import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function isProtectedPath(pathname: string) {
  return (
    pathname === '/chat' ||
    pathname.startsWith('/chat/') ||
    pathname === '/memories' ||
    pathname.startsWith('/memories/') ||
    pathname === '/account' ||
    pathname.startsWith('/account/')
  );
}

function getSafeNextPath(pathname: string, search: string) {
  const combined = `${pathname}${search || ''}`;
  if (!combined.startsWith('/')) return '/';
  if (combined.startsWith('//')) return '/';
  return combined;
}

function buildLoginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  const next = getSafeNextPath(request.nextUrl.pathname, request.nextUrl.search);
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('next', next);
  return url;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({
          name,
          value,
          ...options,
        });

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: any) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const auth = request.nextUrl.searchParams.get('auth');
  const oauth = request.nextUrl.searchParams.get('oauth');
  const nextParam = request.nextUrl.searchParams.get('next');

  const isLoginPage = pathname === '/login';
  const isAuthCallbackPage = pathname === '/auth/callback';

  const isGoogleOauthStatusReturn =
    isLoginPage && auth === 'google' && oauth === 'done';

  if (!user && isProtectedPath(pathname)) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  if (isAuthCallbackPage) {
    return response;
  }

  if (user && isLoginPage && !isGoogleOauthStatusReturn) {
    const safeNext =
      nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
        ? nextParam
        : '/';

    const redirectTarget = safeNext === '/login' ? '/' : safeNext;
    const redirectUrl = new URL(redirectTarget, request.url);

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)',
  ],
};
