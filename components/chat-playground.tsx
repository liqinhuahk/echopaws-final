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
    return 'VIP active: unlimited chats across your account and across all pets.';
  }

  const used = usage.used ?? 0;
  const limit = usage.limit ?? 20;
  return `Used ${used} of ${limit} lifetime chats. Free chats are shared across your account and do not reset daily.`;
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
      (root) =>
        word === root ||
        word === `${root}s` ||
        word === `${root}ed` ||
        word === `${root}ing`,
    ),
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
    <div className='whitespace-pre-wrap break-words leading-7'>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <Fragment key={`text-${index}`}>{segment.content}</Fragment>;
        }

        if (segment.type === 'emphasis') {
          return (
            <em key={`emphasis-${index}`} className='font-medium italic text-slate-700'>
              {segment.content}
            </em>
          );
        }

        return (
          <span
            key={`action-${index}`}
            className='mx-[2px] inline rounded-full border border-orange-200/80 bg-orange-50 px-2 py-0.5 align-baseline text-[0.95em] font-medium italic text-orange-900'
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
      <div className='h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#dddddd] bg-white shadow-sm'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={petImageUrl} alt={`${petName} avatar`} className='h-full w-full object-cover' />
      </div>
    );
  }

  return (
    <div
      className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dddddd] bg-white text-base shadow-sm'
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
    <div className='flex min-h-[620px] flex-col xl:h-full xl:min-h-0'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm'>
          {usageLabel}
        </div>

        <a
          href={memoriesHref}
          className='rounded-full border border-[#d8d8d8] bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50'
        >
          Open Pet Memory Page
        </a>
      </div>

      <div className='mt-5 flex min-h-0 flex-1 flex-col rounded-[28px] border border-[#e5e7eb] bg-[#f5f5f7] p-4 shadow-inner'>
        <div
          ref={messageViewportRef}
          className='min-h-0 flex-1 overflow-y-auto pr-1 overscroll-contain scroll-smooth'
        >
          <div className='grid gap-4'>
            {messages.map((message, index) => {
              const messageKey = `${message.role}-${index}-${message.content.slice(0, 24)}`;

              if (message.role === 'assistant') {
                return (
                  <div key={messageKey} className='flex items-end gap-3'>
                    <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />

                    <div className='min-w-0 max-w-[82%]'>
                      <div className='mb-1 px-1 text-[11px] font-bold tracking-wide text-slate-500'>
                        {petName}
                      </div>

                      <div className='relative rounded-[18px] rounded-bl-md border border-[#e6e6ea] bg-white px-4 py-3 text-[15px] text-slate-800 shadow-sm'>
                        <span className='absolute -left-[6px] bottom-3 h-3 w-3 rotate-45 border-b border-l border-[#e6e6ea] bg-white' />
                        <div className='relative z-[1]'>{renderAssistantContent(message.content)}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={messageKey} className='flex justify-end'>
                  <div className='min-w-0 max-w-[72%]'>
                    <div className='mb-1 px-1 text-right text-[11px] font-bold tracking-wide text-slate-500'>
                      You
                    </div>

                    <div className='relative rounded-[18px] rounded-br-md bg-[#95ec69] px-4 py-3 text-[15px] text-slate-900 shadow-sm'>
                      <span className='absolute -right-[6px] bottom-3 h-3 w-3 rotate-45 bg-[#95ec69]' />
                      <div className='relative z-[1] whitespace-pre-wrap break-words leading-7'>
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className='flex items-end gap-3'>
                <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />

                <div className='min-w-0 max-w-[82%]'>
                  <div className='mb-1 px-1 text-[11px] font-bold tracking-wide text-slate-500'>
                    {petName}
                  </div>

                  <div className='relative rounded-[18px] rounded-bl-md border border-[#e6e6ea] bg-white px-4 py-3 shadow-sm'>
                    <span className='absolute -left-[6px] bottom-3 h-3 w-3 rotate-45 border-b border-l border-[#e6e6ea] bg-white' />
                    <div className='relative z-[1] flex items-center gap-2 text-slate-500'>
                      <span className='h-2 w-2 animate-pulse rounded-full bg-slate-300' />
                      <span className='h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:120ms]' />
                      <span className='h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:240ms]' />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
          {error}
        </div>
      ) : null}

      {memoryHints.length ? (
        <div className='mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-3'>
          <div className='text-xs font-bold uppercase tracking-[0.18em] text-emerald-700'>
            New Memory Triggers
          </div>
          <div className='mt-3 flex flex-wrap gap-2'>
            {memoryHints.map((hint, index) => (
              <span
                key={`${hint}-${index}`}
                className='rounded-full bg-white px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm shadow-emerald-100'
              >
                Remembered: {hint}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <form className='mt-5 shrink-0' onSubmit={handleSubmit}>
        <div className='rounded-[26px] border border-[#e5e7eb] bg-white p-3 shadow-sm'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
            <div className='min-w-0 flex-1'>
              <input
                className='w-full rounded-full border border-[#d9d9de] bg-[#fafafa] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b7b7bd] focus:bg-white'
                type='text'
                placeholder='Type a message, e.g. I am feeling a little tired today'
                value={input}
                maxLength={800}
                onChange={(event) => setInput(event.target.value)}
              />
            </div>

            <button
              type='submit'
              className='inline-flex items-center justify-center rounded-full bg-[#95ec69] px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60'
              disabled={!canSubmit}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>

          <div className='mt-3 flex flex-col gap-2 px-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between'>
            <span>{usageDetail || 'Free chats are shared across your account.'}</span>
            <span>{input.length} / 800</span>
          </div>
        </div>
      </form>
    </div>
  );
}
