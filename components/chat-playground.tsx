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

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

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
    <div className='whitespace-pre-wrap break-words leading-6 text-[15px] sm:leading-7'>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <Fragment key={`text-${index}`}>{segment.content}</Fragment>;
        }

        if (segment.type === 'emphasis') {
          return (
            <em key={`emphasis-${index}`} className='font-medium italic text-amber-100'>
              {segment.content}
            </em>
          );
        }

        return (
          <span
            key={`action-${index}`}
            className='mx-[2px] inline rounded-full border border-amber-300/16 bg-amber-300/10 px-2 py-0.5 align-baseline text-[0.92em] font-medium italic text-amber-200 shadow-[0_2px_8px_rgba(0,0,0,0.18)]'
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
      <div className='h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/12 bg-white/5 shadow-[0_8px_18px_rgba(0,0,0,0.28)] sm:h-11 sm:w-11'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={petImageUrl} alt={`${petName} avatar`} className='h-full w-full object-cover' />
      </div>
    );
  }

  return (
    <div
      className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-sm font-black text-stone-950 shadow-[0_8px_18px_rgba(249,115,22,0.24)] sm:h-11 sm:w-11 sm:text-base'
      aria-label={`${petName} avatar placeholder`}
    >
      {petName.slice(0, 1).toUpperCase()}
    </div>
  );
}

function ToolbarChip({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'accent';
}) {
  return (
    <div
      className={joinClasses(
        'truncate rounded-full px-3 py-2 text-center text-[11px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.18)] sm:text-xs',
        tone === 'accent'
          ? 'border border-amber-300/18 bg-amber-300/10 text-amber-200'
          : 'border border-white/10 bg-white/[0.05] text-stone-200'
      )}
    >
      {children}
    </div>
  );
}

function AssistantBubble({
  children,
  petName,
}: {
  children: ReactNode;
  petName: string;
}) {
  return (
    <div className='min-w-0 max-w-[88%] sm:max-w-[82%]'>
      <div className='mb-1 px-1 text-[10px] font-bold tracking-wide text-amber-200/80 sm:text-[11px]'>
        {petName}
      </div>

      <div className='relative rounded-[18px] rounded-bl-md border border-white/10 bg-[linear-gradient(180deg,rgba(28,21,17,0.98),rgba(17,13,11,0.98))] px-3.5 py-2.5 text-stone-100 shadow-[0_14px_28px_rgba(0,0,0,0.28)] sm:rounded-[20px] sm:px-4 sm:py-3'>
        <span className='absolute -left-[5px] bottom-3 h-2.5 w-2.5 rotate-45 border-b border-l border-white/10 bg-[rgba(21,16,13,0.98)] sm:-left-[6px] sm:h-3 sm:w-3' />
        <div className='relative z-[1]'>{children}</div>
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className='min-w-0 max-w-[82%] sm:max-w-[72%]'>
      <div className='mb-1 px-1 text-right text-[10px] font-bold tracking-wide text-amber-200/80 sm:text-[11px]'>
        You
      </div>

      <div className='relative rounded-[18px] rounded-br-md bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 px-3.5 py-2.5 text-[14px] font-semibold text-stone-950 shadow-[0_12px_28px_rgba(249,115,22,0.28)] sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-[15px]'>
        <span className='absolute -right-[5px] bottom-3 h-2.5 w-2.5 rotate-45 bg-orange-500 sm:-right-[6px] sm:h-3 sm:w-3' />
        <div className='relative z-[1] whitespace-pre-wrap break-words leading-6 sm:leading-7'>
          {children}
        </div>
      </div>
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
    <div className='mobile-chat-shell flex min-h-[56vh] flex-col xl:h-full xl:min-h-0'>
      <div className='mobile-chat-toolbar grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3'>
        <ToolbarChip tone='accent'>{usageLabel}</ToolbarChip>

        <a
          href={memoriesHref}
          className='rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-center text-[11px] font-bold text-stone-200 shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition hover:border-amber-300/20 hover:bg-amber-300/10 hover:text-amber-200 sm:text-xs'
        >
          Open Memories
        </a>
      </div>

      <div className='mobile-chat-card mt-3 flex min-h-0 flex-1 flex-col rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,12,10,0.98),rgba(9,8,7,0.98))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_34px_rgba(0,0,0,0.28)] sm:mt-5 sm:rounded-[28px] sm:p-4'>
        <div
          ref={messageViewportRef}
          className='mobile-chat-scroll min-h-0 flex-1 overflow-y-auto pr-1 overscroll-contain scroll-smooth'
        >
          <div className='grid gap-3 pb-2 sm:gap-4'>
            {messages.map((message, index) => {
              const messageKey = `${message.role}-${index}-${message.content.slice(0, 24)}`;

              if (message.role === 'assistant') {
                return (
                  <div key={messageKey} className='flex items-end gap-2.5 sm:gap-3'>
                    <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />
                    <AssistantBubble petName={petName}>
                      {renderAssistantContent(message.content)}
                    </AssistantBubble>
                  </div>
                );
              }

              return (
                <div key={messageKey} className='flex justify-end'>
                  <UserBubble>{message.content}</UserBubble>
                </div>
              );
            })}

            {loading ? (
              <div className='flex items-end gap-2.5 sm:gap-3'>
                <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />
                <AssistantBubble petName={petName}>
                  <div className='flex items-center gap-2 text-amber-200'>
                    <span className='h-2 w-2 animate-pulse rounded-full bg-amber-300' />
                    <span className='h-2 w-2 animate-pulse rounded-full bg-orange-300 [animation-delay:120ms]' />
                    <span className='h-2 w-2 animate-pulse rounded-full bg-orange-500 [animation-delay:240ms]' />
                  </div>
                </AssistantBubble>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className='mt-3 shrink-0 rounded-2xl border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100'>
            {error}
          </div>
        ) : null}

        {memoryHints.length ? (
          <div className='mt-3 shrink-0 rounded-[22px] border border-amber-300/14 bg-amber-300/8 px-3 py-3 sm:rounded-[24px] sm:px-4'>
            <div className='text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200 sm:text-xs'>
              New Memory Triggers
            </div>

            <div className='mt-2.5 flex flex-wrap gap-2 sm:mt-3'>
              {memoryHints.map((hint, index) => (
                <span
                  key={`${hint}-${index}`}
                  className='rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-semibold text-stone-100 shadow-[0_4px_10px_rgba(0,0,0,0.14)] sm:px-3 sm:py-2 sm:text-xs'
                >
                  Remembered: {hint}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <form className='mobile-chat-composer mt-3 shrink-0 sm:mt-4' onSubmit={handleSubmit}>
          <div className='rounded-[22px] border border-white/10 bg-black/24 p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.24)] sm:rounded-[26px] sm:p-3'>
            <div className='flex items-end gap-2 sm:gap-3'>
              <div className='min-w-0 flex-1'>
                <input
                  className='w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-stone-500 focus:border-amber-300/28 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(251,191,36,0.10)]'
                  type='text'
                  placeholder='Type a message...'
                  value={input}
                  maxLength={800}
                  onChange={(event) => setInput(event.target.value)}
                />
              </div>

              <button
                type='submit'
                className='inline-flex h-[46px] min-w-[78px] items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-orange-500 px-4 text-sm font-extrabold text-stone-950 shadow-[0_12px_28px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:px-5 sm:py-3'
                disabled={!canSubmit}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>

            <div className='mt-2.5 flex items-center justify-between px-1 text-[11px] text-stone-400 sm:mt-3 sm:px-2 sm:text-xs'>
              <span className='truncate pr-3'>
                {usageDetail || 'Free chats are shared across your account.'}
              </span>
              <span className='shrink-0'>{input.length} / 800</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
