import { Suspense } from 'react';
import ChatPageClient from './chat-page-client';

function ChatPageFallback() {
  return (
    <div className="page-noir app-brand-backdrop min-h-screen">
      <div className="container-shell py-8 md:py-14">
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="rounded-[32px] border border-white/10 noir-hero px-6 py-7 shadow-2xl md:px-8 md:py-8">
            <div className="animate-pulse">
              <div className="mb-4 h-8 w-40 rounded-full bg-white/10" />
              <div className="h-12 w-72 rounded-2xl bg-white/10 md:h-16 md:w-96" />
              <div className="mt-4 h-4 w-full max-w-3xl rounded-full bg-white/10" />
              <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-white/10" />
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <section className="rounded-[28px] noir-panel px-5 py-5 md:px-6 md:py-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-28 rounded-full bg-white/10" />
                  <div className="h-8 w-48 rounded-xl bg-white/10" />
                  <div className="mt-5 space-y-3">
                    <div className="h-20 rounded-[20px] bg-white/10" />
                    <div className="h-20 rounded-[20px] bg-white/10" />
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] noir-panel-soft px-5 py-5 md:px-6 md:py-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-32 rounded-full bg-white/10" />
                  <div className="h-8 w-56 rounded-xl bg-white/10" />
                  <div className="h-4 w-full rounded-full bg-white/10" />
                  <div className="h-4 w-[92%] rounded-full bg-white/10" />
                  <div className="h-20 rounded-[20px] bg-white/10" />
                  <div className="h-20 rounded-[20px] bg-white/10" />
                </div>
              </section>
            </aside>

            <section className="rounded-[28px] noir-panel-glow px-4 py-4 sm:px-5 sm:py-5">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="animate-pulse space-y-4">
                  <div className="flex gap-3">
                    <div className="h-8 w-32 rounded-full bg-white/10" />
                    <div className="h-8 w-32 rounded-full bg-white/10" />
                  </div>
                  <div className="h-[420px] rounded-[24px] bg-white/5" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
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
