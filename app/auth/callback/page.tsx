'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey);
}

function getSafeNextPath(raw: string | null) {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

function buildLoginReturnUrl(params: {
  nextPath: string;
  auth?: string;
  oauth: 'done' | 'error';
  message?: string;
}) {
  const search = new URLSearchParams();
  search.set('next', params.nextPath);
  if (params.auth) search.set('auth', params.auth);
  search.set('oauth', params.oauth);
  if (params.message) search.set('message', params.message);
  return `/login?${search.toString()}`;
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const code = searchParams.get('code');
      const auth = searchParams.get('auth') || 'google';
      const nextPath = getSafeNextPath(searchParams.get('next'));

      const oauthError = searchParams.get('error');
      const oauthErrorDescription =
        searchParams.get('error_description') || searchParams.get('error_code');

      if (oauthError) {
        const target = buildLoginReturnUrl({
          nextPath,
          auth,
          oauth: 'error',
          message: oauthErrorDescription || oauthError,
        });
        router.replace(target);
        return;
      }

      if (!code) {
        const target = buildLoginReturnUrl({
          nextPath,
          auth,
          oauth: 'error',
          message: 'Missing OAuth code',
        });
        router.replace(target);
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }

        if (!cancelled) {
          const target = buildLoginReturnUrl({
            nextPath,
            auth,
            oauth: 'done',
          });
          router.replace(target);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to complete Google sign-in';

        if (!cancelled) {
          const target = buildLoginReturnUrl({
            nextPath,
            auth,
            oauth: 'error',
            message,
          });
          router.replace(target);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#f59e0b]" />
          <h1 className="text-2xl font-semibold">正在完成 Google 登录…</h1>
          <p className="mt-3 text-sm text-white/70">
            请稍候，系统正在创建会话并返回登录页显示登录状态。
          </p>
        </div>
      </div>
    </main>
  );
}

function CallbackFallback() {
  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#f59e0b]" />
          <h1 className="text-2xl font-semibold">加载登录回调中…</h1>
        </div>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackContent />
    </Suspense>
  );
}
