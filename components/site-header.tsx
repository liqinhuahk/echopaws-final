'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type NavItem = {
  label: string;
  href?: string;
  isContact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Chat', href: '/chat' },
  { label: 'Memories', href: '/memories' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Account', href: '/account' },
  { label: 'Contact', isContact: true },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function PawIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 3.2c1.45 0 2.63 1.2 2.63 2.68 0 .57-.18 1.11-.48 1.55.97.28 1.86.8 2.58 1.48a2.28 2.28 0 0 1 1.85-.96c1.26 0 2.28 1.04 2.28 2.32 0 1.1-.75 2.01-1.76 2.26.05.26.08.53.08.81 0 3.47-3.13 6.29-6.98 6.29s-6.98-2.82-6.98-6.29c0-.28.03-.55.08-.81A2.31 2.31 0 0 1 3.56 10.3c0-1.28 1.02-2.32 2.28-2.32.73 0 1.38.34 1.8.89a7.33 7.33 0 0 1 2.66-1.53 2.7 2.7 0 0 1-.5-1.46c0-1.48 1.18-2.68 2.2-2.68Z" />
    </svg>
  );
}

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

function MenuIcon() {
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
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function ContactDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

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
      setErrorText(error instanceof Error ? error.message : 'Unable to send message');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close contact dialog overlay"
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
              Fill in your contact information and message below. We’ll send it to the owner email inbox.
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

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const currentPath = useMemo(() => pathname || '/', [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const shouldLock = mobileOpen || contactOpen;
    const original = document.body.style.overflow;

    if (shouldLock) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen, contactOpen]);

  function isActive(href?: string) {
    if (!href) return false;
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(`${href}/`);
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(255,233,220,0.08)] bg-[rgba(8,5,4,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="EchoPaws home"
              className="group flex min-w-0 items-center gap-3 rounded-full transition"
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(255,210,180,0.18)] bg-[linear-gradient(180deg,#ffbb70,#ff9531)] text-[#2f170c] shadow-[0_14px_34px_rgba(255,145,51,0.28)]">
                <PawIcon />
                <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-[rgba(255,255,255,0.32)] bg-[#fff1df]" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-[18px] font-semibold leading-none tracking-[-0.03em] text-[#fff7f1]">
                  EchoPaws
                </div>
                <div className="mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.28em] text-[rgba(255,224,206,0.56)]">
                  AI Companion
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden xl:flex xl:items-center xl:gap-1">
            {NAV_ITEMS.map((item) =>
              item.isContact ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition text-[rgba(255,239,231,0.7)] hover:text-white"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  className={cn(
                    'inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition',
                    isActive(item.href)
                      ? 'border border-[rgba(255,210,180,0.22)] bg-[rgba(255,255,255,0.05)] text-[#fff6ef] shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
                      : 'text-[rgba(255,239,231,0.7)] hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <Link
              href="/login?next=%2F"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
            >
              Sign In
            </Link>

            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-5 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.32)]"
            >
              Get Started
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] text-[#fff5ee] transition hover:bg-white/5 xl:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-[rgba(0,0,0,0.54)] backdrop-blur-sm transition xl:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-[min(88vw,380px)] border-l border-[rgba(255,233,220,0.08)] bg-[linear-gradient(180deg,rgba(18,10,8,0.98),rgba(8,5,4,0.98))] shadow-[-24px_0_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-transform duration-300 xl:hidden',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[rgba(255,233,220,0.08)] px-5 py-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(255,210,180,0.18)] bg-[linear-gradient(180deg,#ffbb70,#ff9531)] text-[#2f170c] shadow-[0_14px_34px_rgba(255,145,51,0.28)]">
                <PawIcon />
                <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-[rgba(255,255,255,0.32)] bg-[#fff1df]" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[17px] font-semibold tracking-[-0.03em] text-[#fff7f1]">
                  EchoPaws
                </div>
                <div className="mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.28em] text-[rgba(255,224,206,0.56)]">
                  AI Companion
                </div>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,233,220,0.12)] bg-[rgba(255,255,255,0.03)] text-[#fff5ee] transition hover:bg-white/5"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="rounded-[24px] border border-[rgba(255,233,220,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#efc39e]">
                Navigation
              </div>

              <div className="mt-4 space-y-3">
                {NAV_ITEMS.map((item) =>
                  item.isContact ? (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        setContactOpen(true);
                      }}
                      className="flex w-full items-center justify-between rounded-2xl border border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm font-medium text-[rgba(255,239,231,0.72)] transition hover:bg-white/5 hover:text-white"
                    >
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href!}
                      className={cn(
                        'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition',
                        isActive(item.href)
                          ? 'border-[rgba(255,191,120,0.3)] bg-[rgba(255,175,96,0.1)] text-[#fff4eb]'
                          : 'border-[rgba(255,233,220,0.1)] bg-[rgba(255,255,255,0.02)] text-[rgba(255,239,231,0.72)] hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <span>{item.label}</span>
                      {isActive(item.href) ? (
                        <span className="rounded-full border border-[rgba(255,191,120,0.22)] bg-[rgba(255,178,96,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f3c28e]">
                          Here
                        </span>
                      ) : null}
                    </Link>
                  )
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/login?next=%2F"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(255,233,220,0.14)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold text-[#fff5ee] transition hover:bg-white/5"
              >
                Sign In
              </Link>

              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffbe72,#ff9430)] px-5 text-sm font-semibold text-[#2f160c] shadow-[0_16px_30px_rgba(255,145,51,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,145,51,0.32)]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
