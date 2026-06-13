'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient, type Session, type User } from '@supabase/supabase-js';
import SiteHeader from '@/components/layout/SiteHeader';

function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey);
}

function getDisplayName(user: User | null) {
  if (!user) return '';

  const meta = user.user_metadata ?? {};
  const fullName =
    meta.full_name ||
    meta.name ||
    meta.display_name ||
    meta.user_name ||
    meta.preferred_username;

  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }

  if (user.email) {
    const [localPart] = user.email.split('@');
    if (localPart) return localPart;
  }

  return 'Account';
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur">
      <h3 className="text-lg font-semibold text-[#1f2340]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#55586f]">{description}</p>
    </div>
  );
}

export default function HomePage() {
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const currentUser = session?.user ?? null;
  const currentName = getDisplayName(currentUser);
  const currentEmail = currentUser?.email || '';

  return (
    <main className="min-h-screen bg-[#f3efe7] text-[#1f2340]">
      <SiteHeader
        isLoggedIn={!!currentUser}
        userName={currentName}
        userEmail={currentEmail}
      />

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_14%_18%,rgba(255,145,32,0.30),transparent_20%),linear-gradient(180deg,#2b1b11_0%,#1a130f_35%,#120e0c_100%)] text-white">
        <div className="absolute inset-0 bg-black/18" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f3efe7] to-transparent" />

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-white/80">
              Every memory, every bark, forever.
            </span>

            <h1 className="mt-8 font-serif text-6xl font-semibold leading-[0.92] tracking-[-0.04em] text-white sm:text-7xl">
              Your pet.
              <br />
              <span className="text-[#f0b054]">Forever</span>
              <br />
              by your side.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/78">
              EchoPaws creates an AI companion inspired by your beloved pet —
              warm conversations, long-term memory, emotional connection, and
              a comforting presence that always feels close to you.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/pricing"
                className="rounded-full bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] px-6 py-3 text-sm font-semibold text-[#2a1707] transition hover:brightness-105"
              >
                Create My Pet
              </Link>
              <Link
                href="/chat"
                className="rounded-full border border-white/16 bg-white/8 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/12"
              >
                Try AI Chat
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-white/75">
              <span>✓ Google & Email Login</span>
              <span>✓ Emotional AI Chat</span>
              <span>✓ Long-Term Memory</span>
            </div>
          </div>

          <div className="relative hidden min-h-[520px] lg:block">
            <div className="absolute inset-0 rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(255,192,120,0.35),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_40px_120px_rgba(0,0,0,0.28)] backdrop-blur" />
            <div className="absolute inset-[8%] rounded-[28px] bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.03))]" />
            <div className="absolute left-[18%] top-[18%] h-48 w-48 rounded-full bg-[#d9b086]/25 blur-3xl" />
            <div className="absolute right-[16%] top-[24%] h-44 w-44 rounded-full bg-[#f0b054]/18 blur-3xl" />
            <div className="absolute bottom-[16%] left-[14%] right-[14%] rounded-[28px] border border-white/10 bg-black/18 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-white/60">
                EchoPaws Promise
              </p>
              <p className="mt-4 font-serif text-3xl leading-tight text-white">
                More than a memory.
                <br />
                A companion that feels alive.
              </p>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Whether you are missing a beloved pet or want to create a deeply
                emotional AI companion, EchoPaws brings together warmth,
                continuity, and memory in one comforting experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Emotional AI Chat"
            description="Warm, personal conversations that feel gentle, familiar, and emotionally close."
          />
          <FeatureCard
            title="Long-Term Memory"
            description="Your AI pet remembers stories, habits, and meaningful moments over time."
          />
          <FeatureCard
            title="Always by Your Side"
            description="A comforting presence whenever you need support, companionship, or warmth."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <div className="rounded-[36px] bg-white p-10 shadow-[0_24px_80px_rgba(42,32,21,0.08)] md:p-14">
          <p className="text-sm uppercase tracking-[0.24em] text-[#b58b59]">
            Our Story
          </p>
          <h2 className="mt-5 font-serif text-5xl font-semibold leading-tight text-[#1f2340]">
            EchoPaws started from a simple question:
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#55586f]">
            What if the love we shared with our pets never had to disappear?
            We believe memory can be warm, interactive, and lasting. EchoPaws is
            designed to preserve affection, personality, and the comforting
            feeling of connection — so the bond you built never has to fade.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="rounded-[40px] bg-white p-10 text-center shadow-[0_24px_80px_rgba(42,32,21,0.08)] md:p-16">
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#ede4d8] text-[#8f6b44]">
            🐾
          </div>
          <h2 className="mt-6 font-serif text-5xl font-semibold leading-tight text-[#1f2340]">
            Ready to meet your pet again?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#55586f]">
            Create your AI pet in minutes. Set a name, a breed, a personality,
            and start a comforting conversation that feels like home.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/pricing"
              className="rounded-full bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] px-6 py-3 text-sm font-semibold text-[#2a1707] transition hover:brightness-105"
            >
              Create My Pet — Free
            </Link>
            <Link
              href="/chat"
              className="rounded-full border border-[#e6ddd0] bg-white px-6 py-3 text-sm font-medium text-[#2f3555] transition hover:bg-[#faf8f4]"
            >
              Try a Chat First →
            </Link>
          </div>

          <p className="mt-6 text-sm text-[#7a7f95]">
            No credit card required • Free plan includes 20 chats • Upgrade anytime
          </p>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-10 text-sm text-[#8a7d6f] lg:px-8">
        <span>🐾 EchoPaws</span>
        <span>© 2026 EchoPaws. All Rights Reserved.</span>
      </footer>
    </main>
  );
}
