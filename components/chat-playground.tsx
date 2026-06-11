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

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatPlaygroundProps = {
  petId?: string | null;
  petName: string;
  petImageUrl?: string | null;
  initialMessages: ChatMessage[];
  initialRemainingLabel: string;
  initialMemorySummary?: string;
};

type UsagePayload = {
  plan?: string;
  used?: number;
  limit?: number | null;
  remaining?: number | null;
  vip?: boolean;
};

type ChatResponse = {
  error?: string;
  message?: string;
  reply?: string;
  usage?: UsagePayload;
  memory?: {
    storedCount?: number;
    emotionTag?: string | null;
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

  if (lowered.includes('pet is required')) {
    return '无法开始对话：当前宠物资料未正确加载。请返回 Chat 页重新选择宠物后再试。';
  }

  if (lowered.includes('unauthorized') || lowered.includes('not authenticated')) {
    return '登录状态已失效，请重新登录后再试。';
  }

  if (lowered.includes('forbidden')) {
    return '当前账号没有权限执行此聊天请求。';
  }

  if (lowered.includes('failed to fetch') || lowered.includes('networkerror')) {
    return '网络连接失败，消息暂时未送出。请检查网络后重试。';
  }

  if (
    lowered.includes('daily chat limit') ||
    lowered.includes('come back tomorrow') ||
    lowered.includes('daily limit')
  ) {
    return '免费额度已用完。升级 VIP 后可获得无限聊天与更完整记忆能力。';
  }

  if (lowered.includes('timeout')) {
    return 'AI 回复超时，请稍后再试。';
  }

  return message || '消息发送失败，请稍后重试。';
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
    'soft bark',
    'excited bark',
    'playful bark',
    'gentle bark',
    'wag wag wag',
    'wiggle wiggle',
    'mrow',
    'meow',
    'purr',
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

type ParsedSegment =
  | { type: 'text'; content: string }
  | { type: 'action'; content: string }
  | { type: 'emphasis'; content: string };

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
    <div className="whitespace-pre-wrap break-words leading-7 text-[15px] text-[#f7efe8]">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <Fragment key={`text-${index}`}>{segment.content}</Fragment>;
        }

        if (segment.type === 'emphasis') {
          return (
            <em key={`emphasis-${index}`} className="font-medium italic text-[#ffe0ba]">
              {segment.content}
            </em>
          );
        }

        return (
          <span
            key={`action-${index}`}
            className="mx-[2px] inline rounded-full border border-[rgba(255,184,107,0.18)] bg-[rgba(245,158,11,0.12)] px-2 py-0.5 align-baseline text-[0.92em] font-medium italic text-[#ffe3c0] shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
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

function extractReply(data: ChatResponse | null) {
  if (!data) return '';
  if (typeof data.reply === 'string' && data.reply.trim()) return data.reply.trim();
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  return '';
}

function extractErrorFromResponse(response: Response, data: ChatResponse | null) {
  if (data?.error) return data.error;
  if (data?.message && !data?.reply) return data.message;

  if (response.status === 400) return '请求无效，请检查消息内容和宠物状态后重试。';
  if (response.status === 401) return '登录状态已失效，请重新登录后再试。';
  if (response.status === 403) return '当前账号没有权限执行此聊天请求。';
  if (response.status === 404) return '聊天服务暂时不可用，请稍后再试。';
  if (response.status >= 500) return '服务器暂时繁忙，消息未送出，请稍后重试。';

  return 'Chat request failed. Please try again.';
}

export function ChatPlayground({
  petId,
  petName,
  petImageUrl,
  initialMessages,
  initialRemainingLabel,
  initialMemorySummary,
}: ChatPlaygroundProps) {
  const fallbackMessages = useMemo<ChatMessage[]>(
    () => [
      {
        role: 'assistant',
        content: `Hi, I'm ${petName} 🐾 I'm here with you.`,
      },
    ],
    [petName]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.length > 0 ? initialMessages : fallbackMessages
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageLabel, setUsageLabel] = useState(initialRemainingLabel);
  const [usageDetail, setUsageDetail] = useState<string | null>(null);
  const [memoryHints, setMemoryHints] = useState<string[]>([]);
  const [memorySummary, setMemorySummary] = useState<string | null>(
    initialMemorySummary || null
  );

  const messageViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(initialMessages.length > 0 ? initialMessages : fallbackMessages);
    setInput('');
    setLoading(false);
    setError(null);
    setUsageLabel(initialRemainingLabel);
    setUsageDetail(null);
    setMemoryHints([]);
    setMemorySummary(initialMemorySummary || null);
  }, [petId, petName, initialMessages, fallbackMessages, initialRemainingLabel, initialMemorySummary]);

  useEffect(() => {
    const el = messageViewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading, error, memoryHints, memorySummary]);

  const trimmedLength = input.trim().length;

  const canSubmit = useMemo(() => {
    return trimmedLength > 0 && trimmedLength <= 800 && !loading;
  }, [trimmedLength, loading]);

  const memoriesHref = petId ? `/memories?pet_id=${encodeURIComponent(petId)}` : '/memories';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    if (!petId) {
      setError('当前宠物资料尚未准备好，无法发送消息。请返回 Chat 页重新选择宠物后再试。');
      return;
    }

    const message = input.trim();
    const nextUserMessage: ChatMessage = { role: 'user', content: message };

    setError(null);
    setMemoryHints([]);
    setLoading(true);
    setInput('');
    setMessages((current) => [...current, nextUserMessage]);

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

      const replyText = extractReply(data);

      if (!response.ok || !replyText) {
        throw new Error(extractErrorFromResponse(response, data));
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: replyText },
      ]);

      if (data?.usage) {
        setUsageLabel(formatUsageLabel(data.usage));
        setUsageDetail(formatUsageDetail(data.usage));
      } else {
        setUsageDetail(null);
      }

      if (data?.memory?.hints?.length) {
        setMemoryHints(data.memory.hints);
      } else {
        setMemoryHints([]);
      }

      if (data?.memory?.summary?.trim()) {
        setMemorySummary(data.memory.summary.trim());
      }
    } catch (submitError) {
      const messageText =
        submitError instanceof Error
          ? normalizeErrorMessage(submitError.message)
          : '消息发送失败，请稍后重试。';

      setMessages((current) => {
        const copy = [...current];
        const last = copy[copy.length - 1];

        if (last?.role === 'user' && last.content === message) {
          copy.pop();
        }

        return copy;
      });

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

                <div className="min-w-0 max-w-[88%] sm:max-w-[80%]">
                  <div className="mb-1 px-1 text-[11px] font-bold tracking-wide text-[rgba(255,244,230,0.60)]">
                    {petName}
                  </div>

                  <div className="rounded-[22px] rounded-bl-md border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-orange-300 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400 [animation-delay:240ms]" />
                      <span className="ml-1 text-sm text-[rgba(255,244,230,0.70)]">
                        {petName} is replying...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mx-4 mt-3 rounded-2xl border border-red-300/18 bg-red-500/10 px-4 py-3 text-sm leading-7 text-red-100 sm:mx-5">
            {error}
          </div>
        ) : null}

        {memoryHints.length ? (
          <div className="mx-4 mt-3 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 sm:mx-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f3c86b]">
              New Memory Triggers
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {memoryHints.map((hint, index) => (
                <span
                  key={`${hint}-${index}`}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-[rgba(255,244,230,0.76)] shadow-[0_4px_10px_rgba(0,0,0,0.14)]"
                >
                  Remembered: {hint}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <form className="mt-3 border-t border-white/8 px-4 pb-4 pt-4 sm:px-5 sm:pb-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="chat-input"
                className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[rgba(255,244,230,0.56)]"
              >
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
            <span className="truncate pr-3">
              {usageDetail || 'Free chats are shared across your account.'}
            </span>
            <span className="shrink-0">{input.length} / 800</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatPlayground;
