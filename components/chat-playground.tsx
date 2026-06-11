'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatPlaygroundProps = {
  petId?: string;
  petName: string;
  petImageUrl?: string | null;
  initialMessages?: ChatMessage[];
  initialRemainingLabel?: string;
  initialMemorySummary?: string;
};

type PetChatCacheItem = {
  messages: ChatMessage[];
  input: string;
  remainingLabel: string;
  memorySummary: string;
  memoryHints: string[];
  updatedAt: number;
};

type PetChatCacheMap = Record<string, PetChatCacheItem>;

const MAX_INPUT_LENGTH = 800;
const CACHE_KEY = 'echopaws_chat_cache_v5';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function isChatRole(value: unknown): value is ChatRole {
  return value === 'user' || value === 'assistant';
}

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (
        item &&
        typeof item === 'object' &&
        isChatRole((item as { role?: unknown }).role) &&
        typeof (item as { content?: unknown }).content === 'string'
      ) {
        return {
          role: (item as { role: ChatRole }).role,
          content: (item as { content: string }).content.trim(),
        };
      }
      return null;
    })
    .filter((item): item is ChatMessage => Boolean(item && item.content));
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function readCache(): PetChatCacheMap {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const result: PetChatCacheMap = {};

    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;

      const item = value as Partial<PetChatCacheItem>;
      result[key] = {
        messages: normalizeMessages(item.messages),
        input: normalizeString(item.input),
        remainingLabel: normalizeString(item.remainingLabel),
        memorySummary: normalizeString(item.memorySummary),
        memoryHints: normalizeStringArray(item.memoryHints),
        updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
      };
    }

    return result;
  } catch {
    return {};
  }
}

function writeCache(updater: (prev: PetChatCacheMap) => PetChatCacheMap) {
  if (typeof window === 'undefined') return;

  try {
    const next = updater(readCache());
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage failures
  }
}

function buildStarterMessages(petName: string, initialMessages?: ChatMessage[]) {
  const normalized = normalizeMessages(initialMessages);
  if (normalized.length > 0) return normalized;

  return [
    {
      role: 'assistant' as const,
      content: `Hi, I'm ${petName} 🐾 I'm here with you.`,
    },
  ];
}

function extractReply(data: unknown): string {
  if (!data || typeof data !== 'object') return '';

  const obj = data as Record<string, unknown>;
  const directCandidates = [
    obj.reply,
    obj.message,
    obj.content,
    obj.text,
    obj.output,
    obj.assistantReply,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (obj.data && typeof obj.data === 'object') {
    const nested = obj.data as Record<string, unknown>;
    const nestedCandidates = [
      nested.reply,
      nested.message,
      nested.content,
      nested.text,
      nested.output,
      nested.assistantReply,
    ];

    for (const candidate of nestedCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return '';
}

function extractRemainingLabel(data: unknown): string {
  if (!data || typeof data !== 'object') return '';

  const obj = data as Record<string, unknown>;
  const directCandidates = [
    obj.remainingLabel,
    obj.usageLabel,
    obj.remaining,
    obj.limitLabel,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (obj.data && typeof obj.data === 'object') {
    const nested = obj.data as Record<string, unknown>;
    const nestedCandidates = [
      nested.remainingLabel,
      nested.usageLabel,
      nested.remaining,
      nested.limitLabel,
    ];

    for (const candidate of nestedCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return '';
}

function extractMemorySummary(data: unknown): string {
  if (!data || typeof data !== 'object') return '';

  const obj = data as Record<string, unknown>;
  const directCandidates = [
    obj.memorySummary,
    obj.memory_message,
    obj.memoryMessage,
    obj.summary,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (obj.memory && typeof obj.memory === 'object') {
    const memory = obj.memory as Record<string, unknown>;
    const nestedCandidates = [
      memory.summary,
      memory.message,
      memory.memorySummary,
      memory.memoryMessage,
    ];
    for (const candidate of nestedCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return '';
}

function extractMemoryHints(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];

  const obj = data as Record<string, unknown>;
  const directArrays = [
    obj.memoryHints,
    obj.memoryTrigger,
    obj.memoryTriggers,
    obj.newMemoryTriggers,
    obj.newMemories,
    obj.remembered,
  ];

  for (const candidate of directArrays) {
    const normalized = normalizeStringArray(candidate);
    if (normalized.length > 0) return normalized;
  }

  if (obj.memory && typeof obj.memory === 'object') {
    const memory = obj.memory as Record<string, unknown>;
    const nestedArrays = [
      memory.hints,
      memory.triggers,
      memory.newTriggers,
      memory.remembered,
      memory.items,
    ];
    for (const candidate of nestedArrays) {
      const normalized = normalizeStringArray(candidate);
      if (normalized.length > 0) return normalized;
    }
  }

  return [];
}

function extractErrorMessage(status: number, data: unknown): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const candidates = [
      obj.error,
      obj.message,
      obj.detail,
      obj.details,
      obj.reason,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    if (obj.data && typeof obj.data === 'object') {
      const nested = obj.data as Record<string, unknown>;
      const nestedCandidates = [
        nested.error,
        nested.message,
        nested.detail,
        nested.details,
        nested.reason,
      ];
      for (const candidate of nestedCandidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim();
        }
      }
    }
  }

  if (status >= 500) return 'Server error. Please try again in a moment.';
  if (status === 401) return 'You need to sign in before sending messages.';
  if (status === 403) return 'You do not have permission to chat with this companion.';
  if (status === 404) return 'Chat service is currently unavailable.';
  return 'Unable to send the message right now.';
}

function normalizeFriendlyError(input: unknown) {
  const raw =
    typeof input === 'string'
      ? input
      : input instanceof Error
        ? input.message
        : 'Unable to send the message right now.';

  const lower = raw.toLowerCase();

  if (lower.includes('pet is required')) {
    return 'The selected pet is not ready yet. Please choose a companion again and retry.';
  }
  if (lower.includes('unauthorized') || lower.includes('sign in')) {
    return 'Please sign in again before continuing the chat.';
  }
  if (lower.includes('forbidden')) {
    return 'This companion is currently unavailable for chat.';
  }
  if (lower.includes('network')) {
    return 'A network issue was detected. Please try again.';
  }
  if (lower.includes('timeout')) {
    return 'The reply took too long. Please send the message again.';
  }
  if (lower.includes('server')) {
    return 'The chat service is temporarily busy. Please try again shortly.';
  }

  return raw || 'Unable to send the message right now.';
}

function PetReplyAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  const initial = normalizeString(name).charAt(0).toUpperCase() || 'P';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,209,174,0.2)] bg-[linear-gradient(180deg,#f6d2b0,#c68444)] text-sm font-semibold text-[#2d170c] shadow-[0_8px_20px_rgba(0,0,0,0.28)]">
      {initial}
    </div>
  );
}

function ScrollIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-4 w-4', direction === 'up' ? '' : 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

function MessageBubble({
  role,
  content,
  petName,
  petImageUrl,
}: {
  role: ChatRole;
  content: string;
  petName: string;
  petImageUrl?: string | null;
}) {
  const isAssistant = role === 'assistant';

  return (
    <div className={cn('flex w-full', isAssistant ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'flex max-w-[88%] items-end gap-3',
          isAssistant ? 'flex-row' : 'flex-row-reverse'
        )}
      >
        {isAssistant ? (
          <PetReplyAvatar name={petName} imageUrl={petImageUrl} />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,198,142,0.18)] bg-[linear-gradient(180deg,#ffbb71,#ff8e2f)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f170c] shadow-[0_8px_20px_rgba(255,145,51,0.24)]">
            You
          </div>
        )}

        <div className={cn('min-w-0', isAssistant ? 'items-start' : 'items-end')}>
          <div
            className={cn(
              'mb-1 text-[11px] font-medium',
              isAssistant ? 'text-[rgba(255,235,223,0.5)]' : 'text-[rgba(255,211,173,0.7)] text-right'
            )}
          >
            {isAssistant ? petName : 'You'}
          </div>

          <div
            className={cn(
              'rounded-[20px] px-4 py-3 text-sm leading-7 shadow-[0_18px_40px_rgba(0,0,0,0.18)]',
              isAssistant
                ? 'border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] text-[rgba(255,245,239,0.88)]'
                : 'border border-[rgba(255,186,118,0.18)] bg-[linear-gradient(180deg,#ffbd74,#ff9431)] text-[#2d150b]'
            )}
          >
            <div className="whitespace-pre-wrap break-words">{content}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatPlayground({
  petId,
  petName,
  petImageUrl,
  initialMessages = [],
  initialRemainingLabel = '',
  initialMemorySummary = '',
}: ChatPlaygroundProps) {
  const starterMessages = useMemo(
    () => buildStarterMessages(petName, initialMessages),
    [petName, initialMessages]
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const currentPetIdRef = useRef<string | undefined>(petId);
  const stickToBottomRef = useRef(true);

  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingLabel, setRemainingLabel] = useState(initialRemainingLabel);
  const [memorySummary, setMemorySummary] = useState(initialMemorySummary);
  const [memoryHints, setMemoryHints] = useState<string[]>([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  function updateScrollFlags() {
    const el = viewportRef.current;
    if (!el) return;

    const threshold = 28;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    const nearTop = el.scrollTop <= threshold;
    const nearBottom = distanceFromBottom <= threshold;

    setCanScrollUp(!nearTop);
    setCanScrollDown(!nearBottom);
    stickToBottomRef.current = nearBottom;
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  function scrollToTop(behavior: ScrollBehavior = 'smooth') {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior });
  }

  useEffect(() => {
    currentPetIdRef.current = petId;
  }, [petId]);

  useEffect(() => {
    if (!petId) {
      setMessages(starterMessages);
      setInput('');
      setRemainingLabel(initialRemainingLabel);
      setMemorySummary(initialMemorySummary);
      setMemoryHints([]);
      setShowMemoryPanel(false);
      setError(null);
      requestAnimationFrame(() => {
        scrollToBottom('auto');
        updateScrollFlags();
      });
      return;
    }

    const cache = readCache();
    const cached = cache[petId];

    if (cached) {
      setMessages(cached.messages.length ? cached.messages : starterMessages);
      setInput(cached.input || '');
      setRemainingLabel(cached.remainingLabel || initialRemainingLabel || '');
      setMemorySummary(cached.memorySummary || initialMemorySummary || '');
      setMemoryHints(cached.memoryHints || []);
    } else {
      setMessages(starterMessages);
      setInput('');
      setRemainingLabel(initialRemainingLabel || '');
      setMemorySummary(initialMemorySummary || '');
      setMemoryHints([]);
    }

    setShowMemoryPanel(false);
    setError(null);

    requestAnimationFrame(() => {
      scrollToBottom('auto');
      updateScrollFlags();
    });
  }, [petId, starterMessages, initialRemainingLabel, initialMemorySummary]);

  useEffect(() => {
    if (!petId) return;

    writeCache((prev) => ({
      ...prev,
      [petId]: {
        messages,
        input,
        remainingLabel,
        memorySummary,
        memoryHints,
        updatedAt: Date.now(),
      },
    }));
  }, [petId, messages, input, remainingLabel, memorySummary, memoryHints]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onScroll = () => updateScrollFlags();

    updateScrollFlags();
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (stickToBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } else {
      requestAnimationFrame(() => updateScrollFlags());
    }
  }, [messages, loading]);

  useEffect(() => {
    requestAnimationFrame(() => updateScrollFlags());
  }, [showMemoryPanel]);

  const trimmedInput = input.trim();
  const canSubmit = Boolean(trimmedInput && trimmedInput.length <= MAX_INPUT_LENGTH && !loading);

  async function submitCurrentMessage() {
    const message = input.trim();

    if (!petId) {
      setError('The selected pet is not ready yet. Please choose a companion again.');
      return;
    }

    if (!message || loading) return;

    setError(null);
    setShowMemoryPanel(false);

    const requestPetId = petId;
    const userMessage: ChatMessage = { role: 'user', content: message };

    stickToBottomRef.current = true;
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          petId: requestPetId,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractErrorMessage(response.status, data));
      }

      const reply = extractReply(data);
      if (!reply) {
        throw new Error('The assistant did not return a reply.');
      }

      const nextRemaining = extractRemainingLabel(data) || remainingLabel;
      const nextSummary = extractMemorySummary(data) || memorySummary;
      const nextHints = extractMemoryHints(data);

      if (currentPetIdRef.current === requestPetId) {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        setRemainingLabel(nextRemaining);
        setMemorySummary(nextSummary);
        if (nextHints.length > 0) {
          setMemoryHints(nextHints);
        }
      } else {
        writeCache((prev) => {
          const existing = prev[requestPetId];
          const existingMessages = existing?.messages?.length
            ? normalizeMessages(existing.messages)
            : [userMessage];

          return {
            ...prev,
            [requestPetId]: {
              messages: [...existingMessages, { role: 'assistant', content: reply }],
              input: existing?.input || '',
              remainingLabel: nextRemaining || existing?.remainingLabel || '',
              memorySummary: nextSummary || existing?.memorySummary || '',
              memoryHints: nextHints.length > 0 ? nextHints : existing?.memoryHints || [],
              updatedAt: Date.now(),
            },
          };
        });
      }
    } catch (err) {
      const friendly = normalizeFriendlyError(err);

      if (currentPetIdRef.current === requestPetId) {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'user' && last.content === message) {
            next.pop();
          }
          return next;
        });
        setInput(message);
        setError(friendly);
      } else {
        writeCache((prev) => {
          const existing = prev[requestPetId];
          const existingMessages = normalizeMessages(existing?.messages || []);
          const nextMessages = [...existingMessages];
          const last = nextMessages[nextMessages.length - 1];
          if (last && last.role === 'user' && last.content === message) {
            nextMessages.pop();
          }

          return {
            ...prev,
            [requestPetId]: {
              messages: nextMessages,
              input: message,
              remainingLabel: existing?.remainingLabel || '',
              memorySummary: existing?.memorySummary || '',
              memoryHints: existing?.memoryHints || [],
              updatedAt: Date.now(),
            },
          };
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCurrentMessage();
  }

  function handleTextareaKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) {
        void submitCurrentMessage();
      }
    }
  }

  const inputLength = input.length;

  return (
    <div className="flex h-[680px] min-h-[620px] max-h-[calc(100vh-190px)] flex-col rounded-[30px] border border-[rgba(255,233,220,0.12)] bg-[linear-gradient(180deg,rgba(26,13,10,0.82),rgba(12,7,6,0.92))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:h-[720px] md:p-5 xl:h-[760px]">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {remainingLabel ? (
              <div className="rounded-full border border-[rgba(255,213,170,0.16)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] font-semibold text-[#f4cda6]">
                {remainingLabel}
              </div>
            ) : null}

            <Link
              href="/memories"
              className="rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] font-medium text-[rgba(255,239,231,0.74)] transition hover:bg-white/5 hover:text-white"
            >
              Open Memories
            </Link>

            {memoryHints.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowMemoryPanel((prev) => !prev)}
                className="rounded-full border border-[rgba(255,212,164,0.16)] bg-[rgba(255,178,96,0.08)] px-3 py-1.5 text-[11px] font-medium text-[#f3c28e] transition hover:bg-[rgba(255,178,96,0.12)]"
              >
                {showMemoryPanel
                  ? 'Hide memory updates'
                  : `${memoryHints.length} memory update${memoryHints.length > 1 ? 's' : ''}`}
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {canScrollUp ? (
              <button
                type="button"
                onClick={() => scrollToTop('smooth')}
                className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] font-medium text-[rgba(255,239,231,0.74)] transition hover:bg-white/5 hover:text-white"
              >
                <ScrollIcon direction="up" />
                Earlier
              </button>
            ) : null}

            {canScrollDown ? (
              <button
                type="button"
                onClick={() => scrollToBottom('smooth')}
                className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,196,140,0.16)] bg-[rgba(255,178,96,0.08)] px-3 py-1.5 text-[11px] font-medium text-[#f3c28e] transition hover:bg-[rgba(255,178,96,0.12)]"
              >
                Latest
                <ScrollIcon direction="down" />
              </button>
            ) : null}

            <div className="text-[11px] font-medium text-[rgba(255,236,226,0.5)]">
              Talking with {petName}
            </div>
          </div>
        </div>

        {memorySummary ? (
          <div className="mt-4 rounded-[20px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full border border-[rgba(255,205,154,0.16)] bg-[rgba(255,179,97,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f0c38f]">
                Memory
              </div>
              <div className="min-w-0 text-sm leading-7 text-[rgba(255,242,236,0.72)]">
                {memorySummary}
              </div>
            </div>
          </div>
        ) : null}

        {showMemoryPanel && memoryHints.length > 0 ? (
          <div className="mt-4 rounded-[22px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f0c38f]">
              Memory updates
            </div>

            <div className="space-y-2">
              {memoryHints.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-full border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs leading-6 text-[rgba(255,240,232,0.62)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative mt-4 min-h-0 flex-1">
        <div
          ref={viewportRef}
          className="h-full overflow-y-auto overscroll-contain rounded-[24px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-4 pr-3 scroll-smooth md:p-5 md:pr-4"
        >
          <div className="space-y-5">
            {messages.map((message, index) => (
              <MessageBubble
                key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
                role={message.role}
                content={message.content}
                petName={petName}
                petImageUrl={petImageUrl}
              />
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="flex items-end gap-3">
                  <PetReplyAvatar name={petName} imageUrl={petImageUrl} />
                  <div>
                    <div className="mb-1 text-[11px] font-medium text-[rgba(255,235,223,0.5)]">
                      {petName}
                    </div>
                    <div className="rounded-[20px] border border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3 text-sm text-[rgba(255,245,239,0.78)]">
                      Thinking…
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {canScrollDown ? (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-[rgba(255,196,140,0.18)] bg-[linear-gradient(180deg,rgba(255,186,118,0.92),rgba(255,147,49,0.92))] px-4 py-2 text-xs font-semibold text-[#2f160c] shadow-[0_16px_32px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5"
          >
            Newer messages
            <ScrollIcon direction="down" />
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 shrink-0 rounded-[20px] border border-[rgba(255,117,117,0.18)] bg-[rgba(121,24,24,0.16)] px-4 py-3 text-sm leading-7 text-[#ffd8d8]">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 shrink-0 border-t border-white/10 pt-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,224,206,0.54)]">
          Message
        </div>

        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1 rounded-[22px] border border-[rgba(255,233,220,0.16)] bg-[rgba(255,255,255,0.03)] px-4 py-3 transition focus-within:border-[rgba(255,191,120,0.28)] focus-within:ring-4 focus-within:ring-[rgba(255,164,84,0.08)]">
            <textarea
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= MAX_INPUT_LENGTH) {
                  setInput(e.target.value);
                }
              }}
              onKeyDown={handleTextareaKeyDown}
              placeholder={`Message ${petName}...`}
              rows={1}
              className="max-h-36 min-h-[28px] w-full resize-none bg-transparent text-sm leading-7 text-[rgba(255,246,240,0.9)] outline-none placeholder:text-[rgba(255,234,224,0.35)]"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-6 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[rgba(255,236,226,0.46)]">
          <div>
            {remainingLabel ? remainingLabel : 'Your chat availability will update automatically.'}
          </div>
          <div>{inputLength}/{MAX_INPUT_LENGTH}</div>
        </div>
      </form>
    </div>
  );
}
