'use client';

import { useEffect, useState } from 'react';

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ContactModal({
  open,
  onClose,
}: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>(
    'idle'
  );
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;

    setStatus('sending');
    setErrorText('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Unable to send message');
      }

      setStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      setStatus('error');
      setErrorText(
        error instanceof Error ? error.message : 'Unable to send message'
      );
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close contact overlay"
        className="absolute inset-0 bg-[rgba(0,0,0,0.62)] backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-[30px] border border-[rgba(255,233,220,0.12)] bg-[linear-gradient(180deg,rgba(18,10,8,0.98),rgba(8,5,4,0.98))] p-5 shadow-[0_32px_80px_rgba(0,0,0,0.4)] md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,224,206,0.68)]">
              Contact EchoPaws
            </div>
            <h2 className="mt-4 font-display text-[34px] leading-[1] tracking-[-0.04em] text-[#fff7f1] md:text-[42px]">
              Send us a message
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[rgba(255,239,231,0.72)]">
              Fill in your contact information and message below. We’ll send it
              to the owner email inbox.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] text-[#fff5ee] transition hover:bg-white/5"
            aria-label="Close contact dialog"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,224,206,0.52)]">
                Name
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                className="h-12 w-full rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-4 text-sm text-[#fff7f1] outline-none transition placeholder:text-[rgba(255,239,231,0.35)] focus:border-[rgba(255,191,120,0.34)]"
                placeholder="Your name"
              />
            </label>

            <label className="block">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,224,206,0.52)]">
                Email
              </div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                maxLength={120}
                className="h-12 w-full rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-4 text-sm text-[#fff7f1] outline-none transition placeholder:text-[rgba(255,239,231,0.35)] focus:border-[rgba(255,191,120,0.34)]"
                placeholder="you@example.com"
              />
            </label>
          </div>

          <label className="block">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,224,206,0.52)]">
              Subject
            </div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={140}
              className="h-12 w-full rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-4 text-sm text-[#fff7f1] outline-none transition placeholder:text-[rgba(255,239,231,0.35)] focus:border-[rgba(255,191,120,0.34)]"
              placeholder="What would you like to talk about"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,224,206,0.52)]">
              Message
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={4000}
              rows={6}
              className="w-full rounded-[22px] border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-7 text-[#fff7f1] outline-none transition placeholder:text-[rgba(255,239,231,0.35)] focus:border-[rgba(255,191,120,0.34)]"
              placeholder="Tell us what you need, what happened, or how we can help."
            />
          </label>

          {status === 'success' ? (
            <div className="rounded-2xl border border-[rgba(137,214,146,0.18)] bg-[rgba(76,175,80,0.08)] px-4 py-3 text-sm text-[#ccebcf]">
              Your message has been sent successfully.
            </div>
          ) : null}

          {status === 'error' ? (
            <div className="rounded-2xl border border-[rgba(255,160,122,0.18)] bg-[rgba(255,120,80,0.08)] px-4 py-3 text-sm text-[#ffd2c3]">
              {errorText || 'Unable to send message right now.'}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-[rgba(255,239,231,0.46)]">
              Messages are sent securely through the site backend.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-5 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.32)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'sending' ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
