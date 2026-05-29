'use client';

import { Fragment, FormEvent, ReactNode, useMemo, useState } from 'react';

type ChatPlaygroundProps = {
  petId?: string | null;
  initialMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  initialRemainingLabel: string;
  initialMemorySummary?: string;
  showInlineSummary?: boolean;
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

const PET_ACTION_WORDS = [
  'purr',
  'purrr',
  'purrrrr',
  'purrrrrr',
  'purring',
  'blink',
  'blinks',
  'blinking',
  'nuzzle',
  'nuzzles',
  'nuzzling',
  'stretch',
  'stretches',
  'stretching',
  'yawn',
  'yawns',
  'yawning',
  'wag',
  'wags',
  'wagging',
  'tilt',
  'tilts',
  'tilting',
  'snuggle',
  'snuggles',
  'snuggling',
  'cuddle',
  'cuddles',
  'cuddling',
  'lick',
  'licks',
  'licking',
  'paw',
  'paws',
  'pawing',
  'chirp',
  'chirps',
  'chirping',
  'meow',
  'meows',
  'meowing',
  'woof',
  'bark',
  'barks',
  'pant',
  'pants',
  'sigh',
  'sighs',
  'head bonk',
  'bonks',
];

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
  const lower = message.toLowerCase();

  if (
    lower.includes('daily chat limit') ||
    lower.includes('come back tomorrow')
  ) {
    return 'Free plan limit reached. Free includes 20 lifetime chats shared across your account. Upgrade to VIP for unlimited chats.';
  }

  return message;
}

function isWrappedAsteriskToken(segment: string) {
  return /^\*[^*]+\*$/.test(segment.trim());
}

function unwrapAsteriskToken(segment: string) {
  return segment.trim().replace(/^\*/, '').replace(/\*$/, '').trim();
}

function looksLikePetAction(raw: string) {
  const text = raw.trim().toLowerCase();
  if (!text) return false;

  if (/(.)\1{2,}/.test(text)) return true;

  if (text.includes(' ')) {
    return PET_ACTION_WORDS.some((word) => text.includes(word));
  }

  return PET_ACTION_WORDS.some((word) => text === word || text.includes(word));
}

function renderInlineRichText(content: string): ReactNode[] {
  const segments = content.split(/(\*[^*]+\*)/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (!isWrappedAsteriskToken(segment)) {
      return <Fragment key={`text-${index}`}>{segment}</Fragment>;
    }

    const tokenText = unwrapAsteriskToken(segment);

    if (looksLikePetAction(tokenText)) {
      return (
        <span
          key={`action-${index}`}
          className='mx-[2px] inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 align-baseline text-[0.95em] font-medium italic text-amber-900/80 ring-1 ring-amber-100'
        >
          {tokenText}
        </span>
      );
    }

    return (
      <em key={`emphasis-${index}`} className='italic text-amber-900/85'>
        {tokenText}
      </em>
    );
  });
}

function renderMessageContent(content: string) {
  const lines = content.split('\n');

  return lines.map((line, lineIndex) => (
    <Fragment key={`line-${lineIndex}`}>
      {renderInlineRichText(line)}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

export function ChatPlayground({
  petId,
  initialMessages,
  initialRemainingLabel,
  initialMemorySummary = '',
  showInlineSummary = false,
}: ChatPlaygroundProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageLabel, setUsageLabel] = useState(initialRemainingLabel);
  const [usageDetail, setUsageDetail] = useState<string | null>(null);
  const [memoryHints, setMemoryHints] = useState<string[]>([]);
  const [memorySummary, setMemorySummary] = useState(initialMemorySummary);

  const trimmedLength = input.trim().length;
  const canSubmit = useMemo(
    () => trimmedLength > 0 && trimmedLength <= 800 && !loading,
    [trimmedLength, loading],
  );

  const memoriesHref = petId
    ? `/memories?pet_id=${encodeURIComponent(petId)}`
    : '/memories';

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

      const data = (await response.json()) as ChatResponse;

      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Chat request failed. Please try again.');
      }

      setMessages((current) => [
        ...current,
        { role: 'user', content: message },
        { role: 'assistant', content: data.reply! },
      ]);

      if (data.usage) {
        setUsageLabel(formatUsageLabel(data.usage));
        setUsageDetail(formatUsageDetail(data.usage));
      }

      if (data.memory?.hints?.length) {
        setMemoryHints(data.memory.hints);
      }

      if (data.memory?.summary) {
        setMemorySummary(data.memory.summary);
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
    <div>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-bold'>
          {usageLabel}
        </div>

        <a
          href={memoriesHref}
          className='rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-900 transition hover:bg-orange-100'
        >
          Open Pet Memory Page
        </a>
      </div>

      {usageDetail ? (
        <div className='mt-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700'>
          {usageDetail}
        </div>
      ) : null}

      {showInlineSummary && memorySummary ? (
        <div className='mt-4 rounded-[24px] border border-orange-100 bg-gradient-to-r from-amber-50 to-rose-50 px-4 py-3'>
          <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
            Companionship Summary
          </div>
          <div className='mt-2 whitespace-pre-line text-sm leading-7 text-slate-700'>
            {memorySummary}
          </div>
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

      <div className='mt-5 grid gap-3'>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
          >
            <div className='whitespace-pre-wrap break-words text-[15px] leading-8'>
              {message.role === 'assistant'
                ? renderMessageContent(message.content)
                : message.content}
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <div className='mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
          {error}
        </div>
      ) : null}

      <form className='mt-5' onSubmit={handleSubmit}>
        <div className='flex gap-3'>
          <input
            className='input-shell rounded-full'
            type='text'
            placeholder='Type a message, e.g. I am feeling a little tired today'
            value={input}
            maxLength={800}
            onChange={(event) => setInput(event.target.value)}
          />
          <button
            className='brand-button whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60'
            disabled={!canSubmit}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className='mt-2 flex items-center justify-between px-2 text-xs text-muted'>
          <span>Free chats are shared across your account.</span>
          <span>{input.length} / 800</span>
        </div>
      </form>
    </div>
  );
}
