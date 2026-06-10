'use client'

import * as React from 'react'

type Role = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  id?: string
  role: Role
  content: string
  createdAt?: string | number | Date
}

type UsagePayload = {
  label?: string | null
  detail?: string | null
}

type ChatResponse =
  | {
      reply?: string
      message?: string
      content?: string
      text?: string
      usage?: UsagePayload | null
      remainingLabel?: string | null
      memorySummary?: string | null
      memory_trigger?: string | null
      memoryTrigger?: string | null
      messages?: Array<{ role?: string; content?: string }>
    }
  | Record<string, unknown>

export type ChatPlaygroundProps = {
  petId: string
  petName: string
  petImageUrl?: string | null
  initialMessages?: ChatMessage[]
  initialRemainingLabel?: string | null
  initialMemorySummary?: string | null
  className?: string
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function uid(prefix = 'msg') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

function normalizeMessages(messages?: ChatMessage[]) {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((item) => item && typeof item.content === 'string')
    .map((item) => ({
      id: item.id ?? uid('initial'),
      role: item.role === 'assistant' || item.role === 'system' ? item.role : 'user',
      content: item.content,
      createdAt: item.createdAt ?? Date.now(),
    }))
}

function normalizeText(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

function extractAssistantText(payload: ChatResponse | null | undefined) {
  if (!payload || typeof payload !== 'object') return ''

  const direct =
    normalizeText(payload.reply) ||
    normalizeText(payload.message) ||
    normalizeText(payload.content) ||
    normalizeText(payload.text)

  if (direct) return direct

  if (Array.isArray(payload.messages)) {
    const assistantMessage = [...payload.messages]
      .reverse()
      .find((item) => item?.role === 'assistant' && normalizeText(item.content))
    if (assistantMessage?.content) return normalizeText(assistantMessage.content)
  }

  return ''
}

function extractMemoryTrigger(payload: ChatResponse | null | undefined) {
  if (!payload || typeof payload !== 'object') return ''
  return normalizeText(payload.memory_trigger) || normalizeText(payload.memoryTrigger)
}

function extractUsage(payload: ChatResponse | null | undefined) {
  if (!payload || typeof payload !== 'object') return { label: '', detail: '' }

  const usage = payload.usage
  const label =
    normalizeText(payload.remainingLabel) ||
    normalizeText(usage?.label) ||
    ''
  const detail = normalizeText(usage?.detail) || ''

  return { label, detail }
}

function extractMemorySummary(
  payload: ChatResponse | null | undefined,
  fallback?: string | null,
) {
  if (!payload || typeof payload !== 'object') return fallback ?? ''
  return normalizeText(payload.memorySummary) || fallback || ''
}

function toTimeLabel(value?: string | number | Date) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getInitial(name: string) {
  const trimmed = name?.trim?.() || 'P'
  return trimmed.charAt(0).toUpperCase()
}

function PetReplyAvatar({
  petName,
  petImageUrl,
}: {
  petName: string
  petImageUrl?: string | null
}) {
  if (petImageUrl) {
    return (
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15 sm:h-9 sm:w-9">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={petImageUrl}
          alt={petName}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffca68,#f29a2e)] text-[12px] font-semibold text-[#2a1408] ring-1 ring-white/15 sm:h-9 sm:w-9">
      {getInitial(petName)}
    </div>
  )
}

function UserAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white/85 ring-1 ring-white/10 sm:h-9 sm:w-9">
      You
    </div>
  )
}

function Bubble({
  role,
  children,
}: {
  role: Role
  children: React.ReactNode
}) {
  if (role === 'user') {
    return (
      <div className="max-w-[86%] rounded-[22px] rounded-br-[8px] bg-[linear-gradient(135deg,#f7bc55,#f28a2e)] px-4 py-3 text-[14px] leading-6 text-[#2b1409] shadow-[0_10px_30px_rgba(242,138,46,0.18)] sm:text-[15px]">
        {children}
      </div>
    )
  }

  return (
    <div className="max-w-[90%] rounded-[22px] rounded-bl-[8px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3 text-[14px] leading-6 text-[#fff7ed] shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:text-[15px]">
      {children}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#f6c15b] [animation-delay:-0.2s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#f6c15b] [animation-delay:-0.1s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#f6c15b]" />
    </div>
  )
}

function renderMultiline(content: string) {
  const parts = content.split('\n')
  return parts.map((line, index) => (
    <React.Fragment key={`${line}-${index}`}>
      {line}
      {index < parts.length - 1 ? <br /> : null}
    </React.Fragment>
  ))
}

export default function ChatPlayground({
  petId,
  petName,
  petImageUrl,
  initialMessages = [],
  initialRemainingLabel,
  initialMemorySummary,
  className,
}: ChatPlaygroundProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(
    normalizeMessages(initialMessages),
  )
  const [input, setInput] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [usageLabel, setUsageLabel] = React.useState(initialRemainingLabel ?? '')
  const [usageDetail, setUsageDetail] = React.useState('')
  const [memorySummary, setMemorySummary] = React.useState(initialMemorySummary ?? '')
  const [memoryTrigger, setMemoryTrigger] = React.useState('')

  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const canSubmit = input.trim().length > 0 && !isSubmitting

  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isSubmitting, memoryTrigger])

  React.useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [input])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isSubmitting) return

    const nextUserMessage: ChatMessage = {
      id: uid('user'),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }

    setMessages((prev) => [...prev, nextUserMessage])
    setInput('')
    setErrorMessage('')
    setMemoryTrigger('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petId,
          message: text,
          petName,
        }),
      })

      let payload: ChatResponse | null = null
      try {
        payload = (await response.json()) as ChatResponse
      } catch {
        payload = null
      }

      if (!response.ok) {
        const fallback =
          normalizeText((payload as any)?.error) ||
          normalizeText((payload as any)?.message) ||
          '发送失败，请稍后再试。'
        throw new Error(fallback)
      }

      const replyText =
        extractAssistantText(payload) || `${petName} 正在认真听你说话。`

      const assistantMessage: ChatMessage = {
        id: uid('assistant'),
        role: 'assistant',
        content: replyText,
        createdAt: Date.now(),
      }

      const usage = extractUsage(payload)
      const nextMemoryTrigger = extractMemoryTrigger(payload)
      const nextMemorySummary = extractMemorySummary(payload, memorySummary)

      setMessages((prev) => [...prev, assistantMessage])
      setUsageLabel(usage.label || usageLabel)
      setUsageDetail(usage.detail || '')
      setMemorySummary(nextMemorySummary)
      setMemoryTrigger(nextMemoryTrigger)
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : '发送失败，请稍后再试。'
      setErrorMessage(nextMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('h-full min-h-0', className)}>
      <section className="flex h-[560px] min-h-[560px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(18,10,8,0.92)] shadow-[0_30px_100px_rgba(0,0,0,0.32)] sm:h-[620px] sm:min-h-[620px]">
        <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[15px] font-semibold text-[#fff6ea] sm:text-[16px]">
                  {petName}
                </h3>
                <span className="rounded-full border border-[#f6c15b]/30 bg-[#f6c15b]/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#ffd67c]">
                  Noir Live
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-5 text-[rgba(255,244,230,0.76)] sm:text-[13px]">
                {memorySummary || '陪你聊天、记录日常、延续你和宠物的记忆连接。'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {usageLabel ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[rgba(255,244,230,0.86)]">
                    {usageLabel}
                  </span>
                ) : null}

                {memorySummary ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[rgba(255,244,230,0.82)]">
                    Open Memories
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div
          ref={viewportRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.22) transparent',
          }}
        >
          <div className="flex min-h-full flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex min-h-[220px] flex-1 items-center justify-center">
                <div className="max-w-md rounded-[24px] border border-white/8 bg-white/[0.03] px-6 py-5 text-center shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffca68,#f29a2e)] text-lg font-semibold text-[#2a1408]">
                    {getInitial(petName)}
                  </div>
                  <p className="text-[15px] font-semibold text-[#fff6ea]">
                    开始和 {petName} 聊天吧
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-[rgba(255,244,230,0.72)]">
                    你可以和它聊今天发生的事、你的心情、回忆、日常或任何想说的话。
                  </p>
                </div>
              </div>
            ) : null}

            {messages.map((message) => {
              const isUser = message.role === 'user'
              const timeLabel = toTimeLabel(message.createdAt)

              return (
                <div
                  key={message.id ?? uid('msg')}
                  className={cn(
                    'flex gap-3',
                    isUser ? 'justify-end' : 'justify-start',
                  )}
                >
                  {!isUser ? (
                    <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />
                  ) : null}

                  <div
                    className={cn(
                      'flex max-w-full flex-col',
                      isUser ? 'items-end' : 'items-start',
                    )}
                  >
                    <Bubble role={message.role}>
                      <div className="whitespace-pre-wrap break-words">
                        {renderMultiline(message.content)}
                      </div>
                    </Bubble>

                    {timeLabel ? (
                      <span className="mt-1.5 px-1 text-[11px] text-white/40">
                        {timeLabel}
                      </span>
                    ) : null}
                  </div>

                  {isUser ? <UserAvatar /> : null}
                </div>
              )
            })}

            {isSubmitting ? (
              <div className="flex justify-start gap-3">
                <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />
                <Bubble role="assistant">
                  <TypingDots />
                </Bubble>
              </div>
            ) : null}
          </div>
        </div>

        {memoryTrigger ? (
          <div className="border-t border-[#f6c15b]/18 bg-[rgba(246,193,91,0.08)] px-4 py-2.5 sm:px-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#f6c15b]">
              New Memory Trigger
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[rgba(255,244,230,0.82)]">
              {memoryTrigger}
            </p>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="border-t border-red-400/20 bg-red-500/10 px-4 py-2.5 sm:px-5">
            <p className="text-[12px] text-red-200">{errorMessage}</p>
          </div>
        ) : null}

        <div className="border-t border-white/8 bg-[rgba(13,8,7,0.98)] px-4 py-4 sm:px-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus-within:border-[#f6c15b]/35 focus-within:bg-[rgba(255,255,255,0.055)]">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={`给 ${petName} 发送消息...`}
                maxLength={800}
                rows={1}
                className="max-h-40 min-h-[56px] w-full resize-none bg-transparent px-4 py-4 text-[15px] leading-6 text-[#fff7ed] outline-none placeholder:text-[rgba(255,244,230,0.38)]"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                {usageDetail ? (
                  <p className="truncate text-[12px] text-[rgba(255,244,230,0.62)]">
                    {usageDetail}
                  </p>
                ) : (
                  <p className="truncate text-[12px] text-[rgba(255,244,230,0.52)]">
                    支持多轮聊天，消息区域可独立上下滚动。
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[11px] text-white/35">
                  {input.length}/800
                </span>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={cn(
                    'inline-flex h-11 items-center justify-center rounded-full px-5 text-[14px] font-semibold transition',
                    canSubmit
                      ? 'bg-[linear-gradient(135deg,#f7bc55,#f28a2e)] text-[#2a1408] shadow-[0_12px_32px_rgba(242,138,46,0.25)] hover:brightness-[1.03]'
                      : 'cursor-not-allowed bg-white/8 text-white/35',
                  )}
                >
                  {isSubmitting ? '发送中...' : 'Send'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
