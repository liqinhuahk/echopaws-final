'use client';

import {
  Fragment,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type ChatPlaygroundProps = {
  petId?: string | null;
  petName: string;
  petImageUrl?: string | null;
  initialMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  initialRemainingLabel: string;
  initialMemorySummary?: string;
};

type UsagePayload = {
  plan: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  vip: boolean;
};

type ChatResponse = {
  error?: string;
  reply?: string;
  usage?: UsagePayload;
  memory?: {
    storedCount: number;
    emotionTag: string | null;
    hints?: string[];
    summary?: string;
  };
};

function formatUsageLabel(usage: UsagePayload) {
  if (usage.vip) return 'VIP — Unlimited Chat';
  const remaining = usage.remaining ?? 0;
  const limit = usage.limit ?? 20;
  return `${remaining} / ${limit} chats left`;
}

function formatUsageDetail(usage: UsagePayload) {
  if (usage.vip) {
    return 'VIP active: unlimited chats across your account and all pets.';
  }
  const used = usage.used ?? 0;
  const limit = usage.limit ?? 20;
  return `Used ${used} of ${limit} chats. Free chats are shared across your account.`;
}

function normalizeErrorMessage(message: string) {
  const lowered = message.toLowerCase();
  if (
    lowered.includes('daily chat limit') ||
    lowered.includes('come back tomorrow') ||
    lowered.includes('daily limit')
  ) {
    return 'Free plan limit reached. Upgrade to VIP for unlimited chats and richer memory.';
  }
  return message;
}

function PetReplyAvatar({
  petName,
  petImageUrl,
}: {
  petName: string;
  petImageUrl?: string | null;
}) {
  if (petImageUrl) {
    return (
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.24)] sm:h-11 sm:w-11">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={petImageUrl} alt={`${petName} avatar`} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,180,94,0.22),rgba(255,122,26,0.12))] text-sm font-black uppercase text-[#ffe7d1] shadow-[0_8px_20px_rgba(0,0,0,0.22)] sm:h-11 sm:w-11"
      aria-label={`${petName} avatar placeholder`}
    >
      {petName.slice(0, 1)}
    </div>
  );
}

function renderAssistantContent(content: string): ReactNode {
  return (
    <div className="whitespace-pre-wrap break-words leading-7 text-[15px] text-[#f7efe8]">
      {content.split('\n').map((line, index) => (
        <Fragment key={`${line}-${index}`}>
          {line}
          {index < content.split('\n').length - 1 ? <br /> : null}
        </Fragment>
      ))}
    </div>
  );
}

export function ChatPlayground({
  petId,
  petName,
  petImageUrl,
  initialMessages,
  initialRemainingLabel,
  initialMemorySummary,
}: ChatPlaygroundProps) {
  const initialAssistantMessage = useMemo(
    () => [{ role: 'assistant' as const, content: `Hi, I'm ${petName} 🐾 I'm here with you.` }],
    [petName]
  );

  const [messages, setMessages] = useState(
    initialMessages.length > 0 ? initialMessages : initialAssistantMessage
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageLabel, setUsageLabel] = useState(initialRemainingLabel);
  const [usageDetail, setUsageDetail] = useState<string>('Free chats are shared across your account.');
  const [memoryHints, setMemoryHints] = useState<string[]>([]);
  const [memorySummary, setMemorySummary] = useState<string | null>(initialMemorySummary ?? null);

  const messageViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(initialMessages.length > 0 ? initialMessages : initialAssistantMessage);
    setUsageLabel(initialRemainingLabel);
    setMemorySummary(initialMemorySummary ?? null);
    setMemoryHints([]);
    setInput('');
    setError(null);
    setLoading(false);
  }, [petId, petName, initialMessages, initialAssistantMessage, initialRemainingLabel, initialMemorySummary]);

  useEffect(() => {
    const el = messageViewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading, error]);

  const trimmedLength = input.trim().length;
  const canSubmit = trimmedLength > 0 && trimmedLength <= 800 && !loading;
  const memoriesHref = petId ? `/memories?pet_id=${encodeURIComponent(petId)}` : '/memories';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const message = input.trim();

    setLoading(true);
    setError(null);
    setMemoryHints([]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, petId }),
      });

      let data: ChatResponse | null = null;

      try {
        data = (await response.json()) as ChatResponse;
      } catch {
        data = null;
      }

      if (!response.ok || !data?.reply) {
        throw new Error(data?.error || 'Chat request failed. Please try again.');
      }

      setMessages((current) => [
        ...current,
        { role: 'user', content: message },
        { role: 'assistant', content: data.reply as string },
      ]);

      if (data.usage) {
        setUsageLabel(formatUsageLabel(data.usage));
        setUsageDetail(formatUsageDetail(data.usage));
      }

      if (data.memory?.summary) {
        setMemorySummary(data.memory.summary);
      }

      if (data.memory?.hints?.length) {
        setMemoryHints(data.memory.hints);
      } else {
        setMemoryHints([]);
      }
    } catch (submitError) {
      const messageText =
        submitError instanceof Error
          ? normalizeErrorMessage(submitError.message)
          : 'Chat request failed. Please try again.';

      setError(messageText);
      setInput(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-2 text-xs font-bold text-[#f6cf7b]">
            {usageLabel}
          </span>

          <a
            href={memoriesHref}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[rgba(255,244,230,0.82)] transition hover:bg-white/[0.07] hover:text-white"
          >
            Open Memories
          </a>
        </div>

        <div className="text-xs text-[rgba(255,244,230,0.58)]">
          Talking with <span className="font-bold text-[rgba(255,244,230,0.88)]">{petName}</span>
        </div>
      </div>

      {memorySummary ? (
        <div className="mt-4 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))] px-4 py-3 text-sm leading-7 text-[rgba(255,244,230,0.76)]">
          <span className="mr-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f3c86b]">
            Memory
          </span>
          {memorySummary}
        </div>
      ) : null}

      <div className="mt-4 flex min-h-[620px] min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.015))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div
          ref={messageViewportRef}
          className="flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-5 sm:pt-5"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.18) transparent',
          }}
        >
          <div className="grid gap-4">
            {messages.map((message, index) => {
              const key = `${message.role}-${index}-${message.content.slice(0, 24)}`;

              if (message.role === 'assistant') {
                return (
                  <div key={key} className="flex items-end gap-3">
                    <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />

                    <div className="min-w-0 max-w-[88%] sm:max-w-[80%]">
                      <div className="mb-1 px-1 text-[11px] font-bold tracking-wide text-[rgba(255,244,230,0.60)]">
                        {petName}
                      </div>

                      <div className="relative rounded-[22px] rounded-bl-md border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                        {renderAssistantContent(message.content)}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={key} className="flex justify-end">
                  <div className="min-w-0 max-w-[82%] sm:max-w-[72%]">
                    <div className="mb-1 px-1 text-right text-[11px] font-bold tracking-wide text-[rgba(255,244,230,0.60)]">
                      You
                    </div>

                    <div className="rounded-[22px] rounded-br-md bg-[linear-gradient(90deg,#ffb45e_0%,#ff9330_50%,#ff7a1a_100%)] px-4 py-3 text-[15px] leading-7 text-white shadow-[0_12px_26px_rgba(249,115,22,0.22)]">
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex items-end gap-3">
                <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />
                <div className="rounded-[22px] rounded-bl-md border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[rgba(255,244,230,0.78)]">
                  {petName} is thinking...
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/8 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          {memoryHints.length ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {memoryHints.map((hint, index) => (
                <span
                  key={`${hint}-${index}`}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-[rgba(255,244,230,0.72)]"
                >
                  {hint}
                </span>
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="mb-3 rounded-2xl border border-red-300/18 bg-red-500/10 px-4 py-3 text-sm leading-7 text-red-100">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label htmlFor="chat-input" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[rgba(255,244,230,0.56)]">
                  Message
                </label>

                <input
                  id="chat-input"
                  className="h-[54px] w-full rounded-full border border-white/12 bg-[rgba(255,255,255,0.06)] px-5 text-[15px] text-[#fff7ed] outline-none transition placeholder:text-[rgba(255,244,230,0.38)] focus:border-amber-300/32 focus:bg-[rgba(255,255,255,0.08)]"
                  type="text"
                  placeholder={`Message ${petName}...`}
                  value={input}
                  maxLength={800}
                  onChange={(event) => setInput(event.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-[54px] min-w-[104px] items-center justify-center rounded-full bg-[linear-gradient(90deg,#ffb45e_0%,#ff9330_50%,#ff7a1a_100%)] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(249,115,22,0.24)] transition hover:-translate-y-[1px] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-[rgba(255,244,230,0.54)] sm:text-xs">
              <span className="truncate pr-3">{usageDetail}</span>
              <span className="shrink-0">{input.length} / 800</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPlayground;
