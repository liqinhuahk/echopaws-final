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
    return 'Free plan limit reached. Free includes 20 lifetime chats shared across your account. Upgrade to VIP for unlimited chats.';
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

  const patterns = [/^([A-Z][A-Za-z\s]{1,28}!\s+)(.+)$/s, /^([A-Za-z]+(?:\s+[A-Za-z]+){0,3}!\s+)(.+)$/s];

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
    <div className="whitespace-pre-wrap break-words leading-6 sm:leading-7">
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
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-[0_6px_16px_rgba(0,0,0,0.24)] sm:h-11 sm:w-11">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={petImageUrl} alt={`${petName} avatar`} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm shadow-[0_6px_16px_rgba(0,0,0,0.24)] sm:h-11 sm:w-11 sm:text-base"
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
  }, [messages, loading]);

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
        <div className="chat-noir-pill truncate rounded-full px-3 py-2 text-center text-[11px] font-bold sm:text-xs">
          {usageLabel}
        </div>

        <a
          href={memoriesHref}
          className="chat-noir-link rounded-full px-3 py-2 text-center text-[11px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.14)] transition sm:text-xs"
        >
          Open Memories
        </a>
      </div>

      <div className="mobile-chat-card mt-3 flex h-[560px] min-h-[560px] min-w-0 flex-col rounded-[22px] p-3 sm:mt-5 sm:h-[620px] sm:min-h-[620px] sm:rounded-[28px] sm:p-4 xl:h-full xl:min-h-0">
        <div
          ref={messageViewportRef}
          className="mobile-chat-scroll h-full min-h-0 flex-1 overflow-y-auto pr-1 overscroll-contain scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.18) transparent',
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
                      <div className="chat-noir-ai-label mb-1 px-1 text-[10px] font-bold tracking-wide sm:text-[11px]">
                        {petName}
                      </div>

                      <div className="chat-noir-ai-bubble relative rounded-[18px] rounded-bl-md px-3.5 py-2.5 text-[14px] sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-[15px]">
                        <span className="chat-noir-ai-bubble-tail absolute -left-[5px] bottom-3 h-2.5 w-2.5 rotate-45 sm:-left-[6px] sm:h-3 sm:w-3" />
                        <div className="relative z-[1]">{renderAssistantContent(message.content)}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={messageKey} className="flex justify-end">
                  <div className="min-w-0 max-w-[82%] sm:max-w-[72%]">
                    <div className="chat-noir-user-label mb-1 px-1 text-right text-[10px] font-bold tracking-wide sm:text-[11px]">
                      You
                    </div>

                    <div className="chat-noir-user-bubble relative rounded-[18px] rounded-br-md px-3.5 py-2.5 text-[14px] font-medium sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-[15px]">
                      <span className="chat-noir-user-bubble-tail absolute -right-[5px] bottom-3 h-2.5 w-2.5 rotate-45 sm:-right-[6px] sm:h-3 sm:w-3" />
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
                  <div className="chat-noir-ai-label mb-1 px-1 text-[10px] font-bold tracking-wide sm:text-[11px]">
                    {petName}
                  </div>

                  <div className="chat-noir-ai-bubble relative rounded-[18px] rounded-bl-md px-3.5 py-2.5 sm:rounded-[20px] sm:px-4 sm:py-3">
                    <span className="chat-noir-ai-bubble-tail absolute -left-[5px] bottom-3 h-2.5 w-2.5 rotate-45 sm:-left-[6px] sm:h-3 sm:w-3" />
                    <div className="chat-noir-loading relative z-[1] flex items-center gap-2">
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
          <div className="chat-noir-error mt-3 shrink-0 rounded-2xl px-4 py-3 text-sm font-bold">
            {error}
          </div>
        ) : null}

        {memoryHints.length ? (
          <div className="chat-noir-hints mt-3 shrink-0 rounded-[20px] px-3 py-3 sm:rounded-[24px] sm:px-4">
            <div className="chat-noir-hints-title text-[11px] font-bold uppercase tracking-[0.18em] sm:text-xs">
              New Memory Triggers
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2 sm:mt-3">
              {memoryHints.map((hint, index) => (
                <span
                  key={`${hint}-${index}`}
                  className="chat-noir-hint-chip rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.14)] sm:px-3 sm:py-2 sm:text-xs"
                >
                  Remembered: {hint}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <form className="mobile-chat-composer mt-3 shrink-0 sm:mt-4" onSubmit={handleSubmit}>
          <div className="chat-noir-composer-card rounded-[22px] p-2.5 sm:rounded-[26px] sm:p-3">
            <div className="flex items-end gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <input
                  className="chat-noir-input w-full rounded-full px-4 py-3 text-[15px] outline-none transition"
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  maxLength={800}
                  onChange={(event) => setInput(event.target.value)}
                />
              </div>

              <button
                type="submit"
                className="chat-noir-submit inline-flex h-[46px] min-w-[78px] items-center justify-center rounded-full px-4 text-sm font-extrabold transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:px-5 sm:py-3"
                disabled={!canSubmit}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>

            <div className="chat-noir-meta mt-2.5 flex items-center justify-between px-1 text-[11px] sm:mt-3 sm:px-2 sm:text-xs">
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
