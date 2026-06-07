import { Suspense } from 'react';
import ChatPageClient from './chat-page-client';

function ChatPageFallback() {
  return (
    <div className="page-noir app-brand-backdrop min-h-screen">
      <main className="container-shell px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[rgba(10,10,10,0.72)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="h-5 w-40 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-10 w-3/4 animate-pulse rounded-2xl bg-white/10" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-white/5" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-white/5" />
            <div className="mt-8 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="h-[420px] animate-pulse rounded-[24px] bg-white/5" />
              <div className="h-[420px] animate-pulse rounded-[24px] bg-white/5" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageFallback />}>
      <ChatPageClient />
    </Suspense>
  );
}
