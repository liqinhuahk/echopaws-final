'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
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

function formatNowTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildAssistantReply(input: string) {
  const text = input.toLowerCase();

  if (
    text.includes('memory') ||
    text.includes('memories') ||
    text.includes('回忆') ||
    text.includes('記憶')
  ) {
    return 'I remember the feeling in what you shared. Tell me one small detail, and I will stay with it together with you.';
  }

  if (
    text.includes('sad') ||
    text.includes('miss') ||
    text.includes('想你') ||
    text.includes('難過') ||
    text.includes('难过')
  ) {
    return 'I am here with you. If you want, we can talk softly about what you are missing right now, one feeling at a time.';
  }

  if (
    text.includes('hello') ||
    text.includes('hi') ||
    text.includes('你好') ||
    text.includes('hey')
  ) {
    return 'Hi — I am here now. What would you like to talk about today?';
  }

  return 'I am listening. Tell me a little more, and I will stay with you through it.';
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.15)] backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#efc27a]">
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-white/65">{description}</p>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-[22px] px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.18)] ${
          isUser
            ? 'bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] text-[#2a1707]'
            : 'border border-white/10 bg-white/[0.05] text-white'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
        <p
          className={`mt-2 text-[11px] ${
            isUser ? 'text-[#5a3510]/80' : 'text-white/45'
          }`}
        >
          {message.time}
        </p>
      </div>
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
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial-assistant-message',
      role: 'assistant',
      content: `Hi, I’m Max 🐾 I’m here with you. Tell me what’s on your heart today.`,
      time: formatNowTime(),
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
      setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const currentUser = session?.user ?? null;
  const currentName = getDisplayName(currentUser);
  const currentEmail = currentUser?.email || '';

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      time: formatNowTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    await new Promise((resolve) => setTimeout(resolve, 550));

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: buildAssistantReply(trimmed),
      time: formatNowTime(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setSending(false);
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
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
                A gentle, memory-aware companion space with the same unified EchoPaws
                brand, logo, and header style used across Home and Login.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/memories"
                  className="rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  View Memories
                </Link>
                <Link
                  href="/account"
                  className="rounded-full bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] px-4 py-2.5 text-sm font-semibold text-[#2a1707] transition hover:brightness-105"
                >
                  Account
                </Link>
              </div>
            </div>

            <InfoCard
              title="Emotional AI Chat"
              description="Warm, personal replies that feel gentle, familiar, and emotionally close."
            />
            <InfoCard
              title="Long-Term Memory"
              description="Your AI companion can hold onto stories, habits, and meaningful moments over time."
            />
            <InfoCard
              title="Always by Your Side"
              description="A comforting space whenever you need support, companionship, or warmth."
            />
          </aside>

          <section className="min-w-0">
            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(40,18,10,0.92)_0%,rgba(20,11,8,0.96)_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full border border-[#e6b46a]/18 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-[#efc27a]">
                      Chat
                    </span>
                    <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] text-white">
                      Your companion space
                    </h1>
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      Talk gently, remember meaningful things, and keep the connection close.
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                    <p className="text-sm font-medium text-white">
                      {currentName || 'Signed in'}
                    </p>
                    <p className="text-[11px] text-white/45">{currentEmail || ''}</p>
                  </div>
                </div>
              </div>

              <div className="h-[58vh] overflow-y-auto px-6 py-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}

                  {sending ? (
                    <div className="flex justify-start">
                      <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-white shadow-[0_12px_36px_rgba(0,0,0,0.18)]">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.2s]" />
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.1s]" />
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/60" />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="border-t border-white/10 px-6 py-5">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tell Max what’s on your heart today…"
                    rows={4}
                    className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-7 text-white outline-none placeholder:text-white/28"
                  />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-white/35">
                      Press Enter to send · Shift + Enter for new line
                    </p>

                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className="rounded-full bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] px-5 py-2.5 text-sm font-semibold text-[#2a1707] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
