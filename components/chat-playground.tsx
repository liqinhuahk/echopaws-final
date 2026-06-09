'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
};

type ChatPlaygroundProps = {
  petId: string | number;
  petName: string;
  petImage?: string | null;
  initialMessages?: ChatMessage[];
  usageLabel?: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeMessages(input?: ChatMessage[]) {
  if (!Array.isArray(input)) return [];
  return input
    .filter(Boolean)
    .map((item, index) => ({
      id: item.id || `msg-${index}-${uid()}`,
      role:
        item.role === 'assistant' || item.role === 'system' || item.role === 'user'
          ? item.role
          : 'assistant',
      content: String(item.content ?? ''),
      createdAt: item.createdAt,
    }))
    .filter((item) => item.content.trim().length > 0);
}

function extractAssistantText(payload: any): string {
  if (!payload) return '';

  if (typeof payload === 'string') return payload;
  if (typeof payload?.reply === 'string') return payload.reply;
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload?.content === 'string') return payload.content;
  if (typeof payload?.text === 'string') return payload.text;
  if (typeof payload?.response === 'string') return payload.response;
  if (typeof payload?.answer === 'string') return payload.answer;

  if (typeof payload?.data?.reply === 'string') return payload.data.reply;
  if (typeof payload?.data?.message === 'string') return payload.data.message;
  if (typeof payload?.data?.content === 'string') return payload.data.content;
  if (typeof payload?.data?.text === 'string') return payload.data.text;

  if (Array.isArray(payload?.messages)) {
    const lastAssistant = [...payload.messages]
      .reverse()
      .find((item) => item?.role === 'assistant' && typeof item?.content === 'string');
    if (lastAssistant?.content) return lastAssistant.content;
  }

  if (Array.isArray(payload?.choices) && payload.choices[0]) {
    const choice = payload.choices[0];
    if (typeof choice?.message?.content === 'string') return choice.message.content;
    if (typeof choice?.text === 'string') return choice.text;
  }

  return '';
}

function AssistantAvatar({
  petName,
  petImage,
}: {
  petName: string;
  petImage?: string | null;
}) {
  if (petImage) {
    return (
      <img
        src={petImage}
        alt={petName}
        className='h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10 md:h-9 md:w-9'
      />
    );
  }

  return (
    <div className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-[11px] font-black text-[#24150b] ring-1 ring-white/10 md:h-9 md:w-9'>
      {petName.slice(0, 1).toUpperCase()}
    </div>
  );
}

function UserAvatar() {
  return (
    <div className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f7b733,#fc8f2b)] text-[11px] font-black text-[#2a1609] shadow-[0_8px_24px_rgba(249,115,22,0.24)] md:h-9 md:w-9'>
      You
    </div>
  );
}

function TypingBubble({ petName, petImage }: { petName: string; petImage?: string | null }) {
  return (
    <div className='flex items-end gap-3'>
      <AssistantAvatar petName={petName} petImage={petImage} />
      <div className='inline-flex min-h-[44px] items-center rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.055)] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)]'>
        <div className='flex items-center gap-1.5'>
          <span className='h-2 w-2 animate-bounce rounded-full bg-amber-200 [animation-delay:-0.2s]' />
          <span className='h-2 w-2 animate-bounce rounded-full bg-amber-200 [animation-delay:-0.1s]' />
          <span className='h-2 w-2 animate-bounce rounded-full bg-amber-200' />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  petName,
  petImage,
}: {
  message: ChatMessage;
  petName: string;
  petImage?: string | null;
}) {
  const isAssistant = message.role === 'assistant' || message.role === 'system';

  if (isAssistant) {
    return (
      <div className='flex items-end gap-3'>
        <AssistantAvatar petName={petName} petImage={petImage} />
        <div className='max-w-[82%] md:max-w-[78%]'>
          <div className='mb-1 pl-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[rgba(255,244,230,0.44)]'>
            {petName}
          </div>
          <div className='rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.055)] px-4 py-3 text-sm leading-7 text-[#fff7ed] shadow-[0_8px_24px_rgba(0,0,0,0.18)]'>
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex justify-end'>
      <div className='max-w-[78%] md:max-w-[72%]'>
        <div className='mb-1 pr-1 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[rgba(255,244,230,0.44)]'>
          You
        </div>
        <div className='flex items-end justify-end gap-3'>
          <div className='rounded-[18px] bg-[linear-gradient(135deg,#f7b733,#fc8f2b)] px-4 py-3 text-sm font-semibold leading-7 text-[#2a1609] shadow-[0_8px_24px_rgba(249,115,22,0.24)]'>
            {message.content}
          </div>
          <UserAvatar />
        </div>
      </div>
    </div>
  );
}

export function ChatPlayground({
  petId,
  petName,
  petImage,
  initialMessages = [],
  usageLabel = 'Companion chat',
}: ChatPlaygroundProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => normalizeMessages(initialMessages));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [inputRows, setInputRows] = useState(1);

  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMessages(normalizeMessages(initialMessages));
  }, [initialMessages]);

  useEffect(() => {
    const el = scrollViewportRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = '0px';
    const next = Math.min(el.scrollHeight, 132);
    el.style.height = `${next}px`;
    setInputRows(next > 72 ? 3 : next > 48 ? 2 : 1);
  }, [input]);

  const remainingHint = useMemo(() => {
    if (/vip/i.test(usageLabel) || /unlimited/i.test(usageLabel)) {
      return 'VIP active · unlimited chats across your account and all pets.';
    }
    return 'Keep chatting to build a warmer, richer long-term memory with your companion.';
  }, [usageLabel]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    setErrorText('');

    const nextUserMessage: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const optimisticMessages = [...messages, nextUserMessage];
    setMessages(optimisticMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petId,
          petName,
          message: text,
          messages: optimisticMessages.map((item) => ({
            role: item.role,
            content: item.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json().catch(() => null);
      const assistantText =
        extractAssistantText(payload) ||
        "I'm here with you. Tell me more, and I'll stay close with every memory we make together.";

      const nextAssistantMessage: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: assistantText,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, nextAssistantMessage]);
    } catch (error) {
      console.error(error);
      setErrorText('发送消息失败，请稍后重试。');
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <div className='flex h-full min-h-0 flex-col bg-transparent text-[#fff7ed]'>
      {/* 顶部小条，保留当前视觉 */}
      <div className='flex shrink-0 items-center justify-between gap-3 border-b border-white/8 px-4 py-3 md:px-5'>
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          <span className='inline-flex h-7 items-center rounded-full border border-amber-300/25 bg-amber-300/10 px-3 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-[#f6cf7b]'>
            {usageLabel}
          </span>

          <span className='text-[11px] font-bold uppercase tracking-[0.16em] text-[rgba(255,244,230,0.52)]'>
            Open Memories
          </span>
        </div>
      </div>

      {/* 关键修复：固定高度框里的内部滚动区 */}
      <div
        ref={scrollViewportRef}
        className='min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5'
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.18) transparent',
        }}
      >
        <div className='space-y-4'>
          {messages.length === 0 ? (
            <div className='flex h-full min-h-[280px] items-center justify-center'>
              <div className='max-w-md rounded-[22px] border border-white/10 bg-[rgba(255,255,255,0.05)] px-5 py-4 text-center shadow-[0_10px_28px_rgba(0,0,0,0.16)]'>
                <div className='mx-auto mb-3 flex w-fit items-center gap-3'>
                  <AssistantAvatar petName={petName} petImage={petImage} />
                  <div className='text-left'>
                    <div className='text-sm font-extrabold text-[#fff7ed]'>Chat with {petName}</div>
                    <div className='text-xs text-[rgba(255,244,230,0.56)]'>
                      Start with something warm and personal.
                    </div>
                  </div>
                </div>
                <p className='text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
                  试着发送一句：「Hi {petName}，今天过得怎么样？」或分享一个你们共同的回忆。
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                petName={petName}
                petImage={petImage}
              />
            ))
          )}

          {loading ? <TypingBubble petName={petName} petImage={petImage} /> : null}
        </div>
      </div>

      {errorText ? (
        <div className='shrink-0 px-4 pb-3 md:px-5'>
          <div className='rounded-2xl border border-red-400/20 bg-red-400/8 px-4 py-3 text-sm text-red-100'>
            {errorText}
          </div>
        </div>
      ) : null}

      {/* 输入区固定在底部 */}
      <form
        onSubmit={handleSubmit}
        className='shrink-0 border-t border-white/8 bg-[rgba(8,5,4,0.72)] px-4 pb-4 pt-4 backdrop-blur-sm md:px-5 md:pb-5'
      >
        <div className='flex items-end gap-3'>
          <div className='min-w-0 flex-1 rounded-[22px] border border-white/10 bg-[rgba(255,255,255,0.045)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              rows={inputRows}
              placeholder={`Type a message for ${petName}...`}
              className='max-h-[132px] min-h-[24px] w-full resize-none overflow-y-auto bg-transparent text-sm leading-6 text-[#fff7ed] placeholder:text-[rgba(255,244,230,0.34)] focus:outline-none'
              disabled={loading}
            />
          </div>

          <button
            type='submit'
            disabled={loading || !input.trim()}
            className='inline-flex h-[46px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f7b733,#fc8f2b)] px-5 text-sm font-extrabold text-[#2a1609] shadow-[0_10px_24px_rgba(249,115,22,0.28)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className='mt-2 flex items-center justify-between gap-3 px-1'>
          <div className='text-[11px] leading-5 text-[rgba(255,244,230,0.42)]'>{remainingHint}</div>
          <div className='shrink-0 text-[11px] font-medium text-[rgba(255,244,230,0.34)]'>
            {input.length}/800
          </div>
        </div>
      </form>
    </div>
  );
}

export default ChatPlayground;
