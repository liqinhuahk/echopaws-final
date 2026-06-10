'use client';

import { Fragment, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

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

type ParsedSegment =
  | { type: 'text'; content: string }
  | { type: 'action'; content: string }
  | { type: 'emphasis'; content: string };

function formatUsageLabel(usage: UsagePayload) {
  if (usage.vip) return 'VIP — Unlimited Chat';
  const remaining = usage.remaining ?? 0;
  const limit = usage.limit ?? 20;
  return `${remaining} / ${limit} lifetime chats left`;
}

function formatUsageDetail(usage: UsagePayload) {
  if (usage.vip) {
    return 'VIP active: unlimited chats across your account and all pets.';
  }

  const used = usage.used ?? 0;
  const limit = usage.limit ?? 20;
  return `Used ${used} of ${limit} lifetime chats. Free chats are shared across your account.`;
}

function normalizeErrorMessage(message: string) {
  const lowered = message.toLowerCase();

  if (
    lowered.includes('daily chat limit') ||
    lowered.includes('come back tomorrow') ||
    lowered.includes('daily limit')
  ) {
    return 'Free plan limit reached. Free includes 20 total lifetime chats shared across your account. Upgrade to VIP for unlimited chats.';
  }

  return message;
}

function normalizeActionText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function isLikelyPetAction(raw: string) {
  const value = normalizeActionText(raw).toLowerCase();
  if (!value) return false;
  if (value.length > 90) return false;

  const actionRoots = [
    'blink',
    'nuzzle',
    'stretch',
    'yawn',
    'purr',
    'wag',
    'snuggle',
    'cuddle',
    'boop',
    'bonk',
    'tilt',
    'lick',
    'paw',
    'rub',
    'curl',
    'hop',
    'bounce',
    'snooze',
    'nap',
    'chirp',
    'meow',
    'woof',
    'sniff',
    'shuffle',
    'flop',
    'roll',
    'bump',
    'press',
    'lean',
    'trot',
    'pounce',
    'sway',
    'swish',
    'nestle',
    'bark',
    'yip',
    'arf',
    'mrow',
    'wiggle',
  ];

  const emotionPrefixes = [
    'happy bark',
    'happy bark!',
    'soft bark',
    'soft bark!',
    'excited bark',
    'excited bark!',
    'playful bark',
    'playful bark!',
    'gentle bark',
    'gentle bark!',
    'wag wag wag',
    'wag wag wag!',
    'wiggle wiggle',
    'wiggle wiggle!',
    'mrow',
    'mrow!',
    'meow',
    'meow!',
    'purr',
    'purr!',
    'woof woof',
    'woof woof!',
    'woof',
    'woof!',
  ];

  if (emotionPrefixes.some((prefix) => value.startsWith(prefix))) {
    return true;
  }

  const compact = value.replace(/\s+/g, '');
  const soundPatterns = [
    /^p+u+r+r+/,
    /^m+e+o+w+/,
    /^w+o+o+f+/,
    /^a+r+f+/,
    /^b+a+r+k+/,
    /^y+i+p+/,
    /^m+r+o+w+/,
    /^w+a+g+/,
    /^c+h+i+r+p+/,
  ];

  if (soundPatterns.some((pattern) => pattern.test(compact))) {
    return true;
  }

  const normalizedWords = value
    .replace(/[^a-z0-9\s!'’-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  return normalizedWords.some((word) =>
    actionRoots.some(
      (root) => word === root || word === `${root}s` || word === `${root}ed` || word === `${root}ing`
    )
  );
}

function splitLeadingActionPrefix(content: string): ParsedSegment[] | null {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const patterns = [
    /^([A-Z][A-Za-z\s]{1,28}!\s+)(.+)$/s,
    /^([A-Za-z]+(?:\s+[A-Za-z]+){0,3}!\s+)(.+)$/s,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (!match) continue;

    const prefix = normalizeActionText(match[1].replace(/\s+$/, ''));
    const rest = match[2];

    if (isLikelyPetAction(prefix)) {
      return [
        { type: 'action', content: prefix },
        { type: 'text', content: ` ${rest}` },
      ];
    }
  }

  return null;
}

function parseAssistantMessage(content: string): ParsedSegment[] {
  const prefixed = splitLeadingActionPrefix(content);
  if (prefixed) return prefixed;

  const segments: ParsedSegment[] = [];
  const regex = /\*([^*]+)\*/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const inner = match[1];
    const start = match.index;

    if (start > lastIndex) {
      const leading = content.slice(lastIndex, start);
      if (leading) {
        segments.push({ type: 'text', content: leading });
      }
    }

    const cleaned = normalizeActionText(inner);

    if (cleaned) {
      segments.push({
        type: isLikelyPetAction(cleaned) ? 'action' : 'emphasis',
        content: cleaned,
      });
    } else {
      segments.push({ type: 'text', content: fullMatch });
    }

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) });
  }

  if (!segments.length) {
    return [{ type: 'text', content }];
  }

  return segments;
}

function renderAssistantContent(content: string): ReactNode {
  const segments = parseAssistantMessage(content);

  return (
    <div className="whitespace-pre-wrap break-words leading-6 text-[rgba(255,247,237,0.92)] sm:leading-7">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <Fragment key={`text-${index}`}>{segment.content}</Fragment>;
        }

        if (segment.type === 'emphasis') {
          return (
            <em key={`emphasis-${index}`} className="font-medium italic text-amber-100">
              {segment.content}
            </em>
          );
        }

        return (
          <span
            key={`action-${index}`}
            className="mx-[2px] inline rounded-full border border-[rgba(255,184,107,0.18)] bg-[rgba(245,158,11,0.12)] px-2 py-0.5 align-baseline text-[0.92em] font-medium italic text-amber-100 shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
          >
            {segment.content}
          </span>
        );
      })}
    </div>
  );
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
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.22)] sm:h-9 sm:w-9">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={petImageUrl} alt={`${petName} avatar`} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs shadow-[0_4px_12px_rgba(0,0,0,0.22)] sm:h-9 sm:w-9 sm:text-sm"
      aria-label={`${petName} avatar placeholder`}
    >
      🐾
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
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageLabel, setUsageLabel] = useState(initialRemainingLabel);
  const [usageDetail, setUsageDetail] = useState<string | null>(null);
  const [memoryHints, setMemoryHints] = useState<string[]>([]);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
    setInput('');
    setLoading(false);
    setError(null);
    setUsageLabel(initialRemainingLabel);
    setUsageDetail(null);
    setMemoryHints([]);
  }, [petId, petName, petImageUrl, initialMessages, initialRemainingLabel, initialMemorySummary]);

  useEffect(() => {
    const el = messageViewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading, memoryHints]);

  const trimmedLength = input.trim().length;

  const canSubmit = useMemo(() => {
    return trimmedLength > 0 && trimmedLength <= 800 && !loading;
  }, [trimmedLength, loading]);

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
        headers: {
          'Content-Type': 'application/json',
        },
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
      } else {
        setUsageDetail(null);
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
    <div className="mobile-chat-shell flex h-full min-h-[56vh] flex-col xl:min-h-0">
      <div className="mobile-chat-toolbar grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <div className="truncate rounded-full border border-amber-300/20 bg-[rgba(255,183,59,0.10)] px-3 py-2 text-center text-[11px] font-bold text-[#f5d27a] shadow-[0_4px_12px_rgba(0,0,0,0.14)] sm:text-xs">
          {usageLabel}
        </div>

        <a
          href={memoriesHref}
          className="rounded-full border border-white/12 bg-[rgba(255,255,255,0.05)] px-3 py-2 text-center text-[11px] font-bold text-[rgba(255,247,237,0.82)] shadow-[0_4px_12px_rgba(0,0,0,0.14)] transition hover:bg-[rgba(255,255,255,0.08)] sm:text-xs"
        >
          Open Memories
        </a>
      </div>

      <div className="mobile-chat-card mt-3 flex h-[560px] min-h-[560px] min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(18,10,8,0.92)] p-3 shadow-[0_12px_34px_rgba(0,0,0,0.22)] sm:mt-5 sm:h-[620px] sm:min-h-[620px] sm:rounded-[28px] sm:p-4 xl:h-[680px] xl:min-h-[680px]">
        <div
          ref={messageViewportRef}
          className="mobile-chat-scroll min-h-0 flex-1 overflow-y-auto pr-1 overscroll-contain scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.22) transparent',
          }}
        >
          <div className="grid gap-3 pb-2 sm:gap-4">
            {messages.map((message, index) => {
              const messageKey = `${message.role}-${index}-${message.content.slice(0, 24)}`;

              if (message.role === 'assistant') {
                return (
                  <div key={messageKey} className="flex items-end gap-2.5 sm:gap-3">
                    <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />
                    <div className="min-w-0 max-w-[88%] sm:max-w-[82%]">
                      <div className="mb-1 px-1 text-[10px] font-bold tracking-wide text-[rgba(255,244,230,0.56)] sm:text-[11px]">
                        {petName}
                      </div>

                      <div className="relative rounded-[18px] rounded-bl-md border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] px-3.5 py-2.5 text-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-[15px]">
                        <span className="absolute -left-[5px] bottom-3 h-2.5 w-2.5 rotate-45 border-l border-b border-white/8 bg-[rgba(255,255,255,0.04)] sm:-left-[6px] sm:h-3 sm:w-3" />
                        <div className="relative z-[1]">{renderAssistantContent(message.content)}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={messageKey} className="flex justify-end">
                  <div className="min-w-0 max-w-[82%] sm:max-w-[72%]">
                    <div className="mb-1 px-1 text-right text-[10px] font-bold tracking-wide text-[rgba(255,244,230,0.56)] sm:text-[11px]">
                      You
                    </div>

                    <div className="relative rounded-[18px] rounded-br-md bg-[linear-gradient(135deg,#f6b73c,#f28a2e)] px-3.5 py-2.5 text-[14px] font-semibold text-[#2a1609] shadow-[0_8px_24px_rgba(249,115,22,0.20)] sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-[15px]">
                      <span className="absolute -right-[5px] bottom-3 h-2.5 w-2.5 rotate-45 bg-[#f39a33] sm:-right-[6px] sm:h-3 sm:w-3" />
                      <div className="relative z-[1] whitespace-pre-wrap break-words leading-6 sm:leading-7">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex items-end gap-2.5 sm:gap-3">
                <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />
                <div className="min-w-0 max-w-[88%] sm:max-w-[82%]">
                  <div className="mb-1 px-1 text-[10px] font-bold tracking-wide text-[rgba(255,244,230,0.56)] sm:text-[11px]">
                    {petName}
                  </div>

                  <div className="relative rounded-[18px] rounded-bl-md border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:rounded-[20px] sm:px-4 sm:py-3">
                    <span className="absolute -left-[5px] bottom-3 h-2.5 w-2.5 rotate-45 border-l border-b border-white/8 bg-[rgba(255,255,255,0.04)] sm:-left-[6px] sm:h-3 sm:w-3" />
                    <div className="relative z-[1] flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-orange-300 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400 [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-3 shrink-0 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
            {error}
          </div>
        ) : null}

        {memoryHints.length ? (
          <div className="mt-3 shrink-0 rounded-[20px] border border-amber-300/14 bg-[rgba(255,183,59,0.06)] px-3 py-3 sm:rounded-[24px] sm:px-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f1c76c] sm:text-xs">
              New Memory Triggers
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2 sm:mt-3">
              {memoryHints.map((hint, index) => (
                <span
                  key={`${hint}-${index}`}
                  className="rounded-full border border-white/8 bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-[11px] font-semibold text-[rgba(255,247,237,0.82)] shadow-[0_4px_10px_rgba(0,0,0,0.14)] sm:px-3 sm:py-2 sm:text-xs"
                >
                  Remembered: {hint}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <form className="mobile-chat-composer mt-3 shrink-0 sm:mt-4" onSubmit={handleSubmit}>
          <div className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-2.5 sm:rounded-[26px] sm:p-3">
            <div className="flex items-end gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <input
                  className="w-full rounded-full border border-white/8 bg-[rgba(255,255,255,0.06)] px-4 py-3 text-[15px] text-[#fff7ed] outline-none transition placeholder:text-[rgba(255,244,230,0.34)] focus:border-white/14"
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  maxLength={800}
                  onChange={(event) => setInput(event.target.value)}
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-[46px] min-w-[78px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#f6b73c,#f28a2e)] px-4 text-sm font-extrabold text-[#2a1609] shadow-[0_10px_24px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:px-5 sm:py-3"
                disabled={!canSubmit}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>

            <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-[rgba(255,244,230,0.48)] sm:mt-3 sm:px-2 sm:text-xs">
              <span className="truncate pr-3">
                {usageDetail || 'Free chats are shared across your account.'}
              </span>
              <span className="shrink-0">{input.length} / 800</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatPlayground;
