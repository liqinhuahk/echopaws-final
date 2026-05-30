'use client';

import { Fragment, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

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
  if (usage.vip) {
    return 'VIP — Unlimited Chat';
  }

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

  const normalized = value.replace(/[^\p{L}\p{N}\s,'’-]/gu, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) return false;

  const simpleEmphasisWords = new Set([
    'just',
    'love',
    'really',
    'very',
    'so',
    'always',
    'never',
    'truly',
    'literally',
    'super',
    'best',
    'okay',
    'ok',
  ]);

  if (words.length === 1 && simpleEmphasisWords.has(words[0])) {
    return false;
  }

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
  ];

  const soundPatterns = [
    /^p+u+r+r+/,
    /^m+e+o+w+/,
    /^w+o+o+f+/,
    /^a+r+f+/,
    /^r+u+f+f+/,
    /^m+r+r+p+/,
    /^c+h+i+r+p+/,
  ];

  const compact = value.replace(/\s+/g, '');
  if (soundPatterns.some((pattern) => pattern.test(compact))) {
    return true;
  }

  const hasActionWord = words.some((word) =>
    actionRoots.some(
      (root) =>
        word === root ||
        word === `${root}s` ||
        word === `${root}ed` ||
        word === `${root}ing`,
    ),
  );

  const hasStageDirectionShape =
    /\b(softly|slowly|gently|sleepily|happily|at you|toward you|towards you|your hand|your face|and|then)\b/.test(
      value,
    ) || /,/.test(value);

  if (words.length >= 2 && hasActionWord) {
    return true;
  }

  if (words.length >= 4 && hasActionWord && hasStageDirectionShape) {
    return true;
  }

  return false;
}

function parseAssistantMessage(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const regex = /\*([^*]+)\*/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const inner = match[1];
    const start = match.index;

    if (start > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, start),
      });
    }

    const cleaned = normalizeActionText(inner);

    if (cleaned) {
      segments.push({
        type: isLikelyPetAction(cleaned) ? 'action' : 'emphasis',
        content: cleaned,
      });
    } else {
      segments.push({
        type: 'text',
        content: fullMatch,
      });
    }

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
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
            className='mx-[2px] inline rounded-full border border-orange-200/70 bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-0.5 align-baseline text-[0.95em] font-medium italic text-orange-900'
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
      <div className='h-10 w-10 shrink-0 overflow-hidden rounded-full border border-orange-100 bg-orange-50 shadow-sm'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={petImageUrl}
          alt={`${petName} avatar`}
          className='h-full w-full object-cover'
        />
      </div>
    );
  }

  return (
    <div
      className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-orange-100 text-base text-orange-900 shadow-sm'
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
}: ChatPlaygroundProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageLabel, setUsageLabel] = useState(initialRemainingLabel);
  const [usageDetail, setUsageDetail] = useState<string | null>(null);
  const [memoryHints, setMemoryHints] = useState<string[]>([]);

  useEffect(() => {
    setMessages(initialMessages);
    setInput('');
    setLoading(false);
    setError(null);
    setUsageLabel(initialRemainingLabel);
    setUsageDetail(null);
    setMemoryHints([]);
  }, [petId, petName, petImageUrl, initialMessages, initialRemainingLabel]);

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
        { role: 'assistant', content: data.reply! },
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
    <div className='flex min-h-0 flex-col'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm'>
          {usageLabel}
        </div>

        <a
          href={memoriesHref}
          className='rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-900 transition hover:bg-orange-100'
        >
          Open Pet Memory Page
        </a>
      </div>

      <div className='mt-5 grid gap-3'>
        {messages.map((message, index) => {
          const messageKey = `${message.role}-${index}-${message.content.slice(0, 24)}`;

          if (message.role === 'assistant') {
            return (
              <div key={messageKey} className='flex items-end gap-3'>
                <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />

                <div className='min-w-0 max-w-[85%]'>
                  <div className='chat-bubble-ai'>
                    {renderAssistantContent(message.content)}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={messageKey} className='flex justify-end'>
              <div className='max-w-[85%]'>
                <div className='chat-bubble-user'>
                  <div className='whitespace-pre-wrap break-words leading-7'>{message.content}</div>
                </div>
              </div>
            </div>
          );
        })}

        {loading ? (
          <div className='flex items-end gap-3'>
            <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />

            <div className='min-w-0 max-w-[85%]'>
              <div className='chat-bubble-ai'>
                <div className='flex items-center gap-2 text-slate-500'>
                  <span className='h-2 w-2 animate-pulse rounded-full bg-orange-300' />
                  <span className='h-2 w-2 animate-pulse rounded-full bg-orange-300 [animation-delay:120ms]' />
                  <span className='h-2 w-2 animate-pulse rounded-full bg-orange-300 [animation-delay:240ms]' />
                </div>
              </div>
            </div>
          </div>
        ) : null}
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

      <form className='mt-5' onSubmit={handleSubmit}>
        <div className='flex flex-col gap-3 sm:flex-row'>
          <input
            className='input-shell rounded-full'
            type='text'
            placeholder='Type a message, e.g. I am feeling a little tired today'
            value={input}
            maxLength={800}
            onChange={(event) => setInput(event.target.value)}
          />
          <button
            type='submit'
            className='brand-button whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60'
            disabled={!canSubmit}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className='mt-3 flex flex-col gap-2 px-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between'>
          <span>{usageDetail || 'Free chats are shared across your account.'}</span>
          <span>{input.length} / 800</span>
        </div>
      </form>
    </div>
  );
}
