'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, type Session, type User } from '@supabase/supabase-js';
import SiteHeader from '@/components/layout/SiteHeader';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
};

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

function nowTimeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createAssistantReply(input: string) {
  const text = input.toLowerCase();

  if (text.includes('memory') || text.includes('记忆') || text.includes('回忆')) {
    return `I remember the feeling in that story. Tell me one small detail, and I’ll hold onto it with you.`;
  }

  if (text.includes('sad') || text.includes('miss') || text.includes('想你') || text.includes('难过')) {
    return `I'm here with you. If you want, we can talk softly about what you're missing right now, one feeling at a time.`;
  }

  if (text.includes('hello') || text.includes('hi') || text.includes('你好')) {
    return `Hi — I’m here now. What would you like to talk about today?`;
  }

  return `I’m listening. Tell me a little more, and I’ll stay with you through it.`;
}

function MemoryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#efc27a]">{title}</p>
      <p className="mt-3 text-sm leading-7 text-white/72">{value}</p>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      content: `Hi, I’m Max 🐾 I’m here with you. Tell me what’s on your heart today.`,
      time: nowTimeLabel(),
    },
  ]);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!data.session) {
        router.replace('/login?next=/chat');
        return;
      }

      setSession(data.session);
      setReady(true);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;

      if (!currentSession) {
        router.replace('/login?next=/chat');
        return;
      }

      setSession(currentSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentUser = session?.user ?? null;
  const currentName = getDisplayName(currentUser);
  const currentEmail = currentUser?.email || '';

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      time: nowTimeLabel(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    await new Promise((resolve) => setTimeout(resolve, 550));

    const assistantMessage: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: createAssistantReply(trimmed),
      time: nowTimeLabel(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setSending(false);
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_14%_18%,rgba(255,120,20,0.24),transparent_18%),linear-gradient(180deg,#120906_0%,#060304_100%)] text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
          <div className="w-full rounded-[28px] border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#f59e0b]" />
            <h1 className="text-2xl font-semibold">Loading chat…</h1>
            <p className="mt-3 text-sm text-white/65">
              Preparing your companion space.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_14%_18%,rgba(255,120,20,0.24),transparent_18%),radial-gradient(circle_at_84%_28%,rgba(255,132,0,0.18),transparent_16%),linear-gradient(180deg,#120906_0%,#090304_42%,#060304_100%)] text-white">
      <SiteHeader
        isLoggedIn={!!currentUser}
        userName={currentName}
        userEmail={currentEmail}
      />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
          <aside className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur">
              <span className="inline-flex rounded-full border border-[#e6b46a]/18 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-[#efc27a]">
                Companion
              </span>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-white">
                Max is here
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/65">
                A gentle, memory-aware companion space with the same unified EchoPaws brand,
                logo, and header style used across Home and Login.
              </p>

              <div className="mt-5 flex gap-3">
                <Link
                  href="/memories"
                  className="rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  View Memories
                </Link>
                <Link
                  href="/account"
                  className="rounded-full bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] px-4 py-
