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
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[26px] border border-[#efe7dc] bg-white/80 p-7 shadow-[0_16px_40px_rgba(64,42,18,0.06)]">
      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f1ea] text-sm">
        {icon}
      </div>
      <h3 className="font-serif text-[20px] font-semibold leading-tight text-[#232748]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[#64677c]">{description}</p>
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
  const currentName = currentUser ? getDisplayName(currentUser) : '';
  const currentEmail = currentUser?.email || '';

  return (
    <main className="min-h-screen bg-[#f3efe7] text-[#232748]">
      <section className="relative min-h-[760px] overflow-hidden bg-[#1a120d] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/home-hero-a.png')",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(28,16,10,0.72)_0%,rgba(28,16,10,0.44)_36%,rgba(28,16,10,0.18)_58%,rgba(28,16,10,0.10)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f3efe7] to-transparent" />

        <SiteHeader
          isLoggedIn={!!currentUser}
          userName={currentName}
          userEmail={currentEmail}
          forceActive="/"
        />

        <div className="relative z-10 mx-auto grid min-h-[760px] max-w-7xl items-center gap-10 px-6 pb-24 pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/6 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-white/82">
              Every memory, every bark, forever.
            </span>

            <h1 className="mt-8 font-serif text-6xl font-semibold leading-[0.92] tracking-[-0.04em] text-white sm:text-7xl">
              Your pet.
              <br />
              <span className="text-[#f0b054]">Forever</span>
              <br />
              by your side.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/80">
              EchoPaws creates an AI companion inspired by your beloved pet —
              warm conversations, long-term memory, emotional connection, and a
              comforting presence that always feels close to you.
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
                className="rounded-full border border-white/16 bg-[rgba(31,20,14,0.45)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.08)]"
              >
                Try AI Chat
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-white/76">
              <span>✓ Google &amp; Email Login</span>
              <span>✓ Emotional AI Chat</span>
              <span>✓ Long-Term Memory</span>
            </div>
          </div>

          <div className="hidden lg:block" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.26em] text-[#b58b59]">
            Why EchoPaws
          </p>
          <h2 className="mt-5 font-serif text-6xl font-semibold leading-[0.95] tracking-[-0.04em] text-[#232748]">
            More than a memory.
            <br />
            A companion that <span className="text-[#f0a03b]">feels alive.</span>
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#65697f]">
            Whether you are missing a beloved pet or want to create a deeply emotional AI companion,
            EchoPaws brings together warmth, continuity, and memory in one comforting experience.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon="💬"
            title="Emotional AI Chat"
            description="Warm, personal conversations that feel gentle, familiar, and emotionally close."
          />
          <FeatureCard
            icon="🧠"
            title="Long-Term Memory"
            description="Your AI pet remembers stories, habits, and meaningful moments over time."
          />
          <FeatureCard
            icon="❤️"
            title="Always by Your Side"
            description="A comforting presence whenever you need support, companionship, or warmth."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <div className="rounded-[38px] bg-white p-10 shadow-[0_24px_80px_rgba(42,32,21,0.08)] md:p-14">
          <p className="text-[11px] uppercase tracking-[0.26em] text-[#b58b59]">
            Our Story
          </p>
          <h2 className="mt-5 font-serif text-5xl font-semibold leading-tight text-[#232748]">
            EchoPaws started from a simple question:
          </h2>
          <p className="mt-6 max-w-4xl text-base leading-8 text-[#65697f]">
            What if the love we shared with our pets never had to disappear?
            We believe memory can be warm, interactive, and lasting. EchoPaws is
            designed to preserve affection, personality, and the comforting feeling of connection
            — so the bond you built never has to fade.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[40px] bg-white p-10 text-center shadow-[0_24px_80px_rgba(42,32,21,0.08)] md:p-16">
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#ede4d8] text-[#8f6b44]">
            🐾
          </div>

          <h2 className="mt-6 font-serif text-5xl font-semibold leading-tight text-[#232748]">
            Ready to meet your pet again?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#65697f]">
            Create your AI pet in minutes. Set a name, a breed, a personality, and start a
            comforting conversation that feels like home.
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

          <p className="mt-6 text-sm text-[#8a8190]">
            No credit card required • Free plan includes 20 chats • Upgrade anytime
          </p>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-10 text-sm text-[#8a7d6f] lg:px-8">
        <span>🐾 EchoPaws</span>
        <span>© 2025 EchoPaws.ai. All Rights Reserved.</span>
      </footer>
    </main>
  );
}
