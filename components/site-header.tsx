'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type SiteHeaderTheme = 'dark' | 'light';

type SiteHeaderProps = {
  theme?: SiteHeaderTheme;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

// TODO: 请替换成你的真实收件邮箱
const SUPPORT_EMAIL = 'YOUR_EMAIL_HERE';

type NavItem = {
  label: string;
  href?: string;
  matchMode?: 'exact' | 'startsWith' | 'never';
  isContact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', matchMode: 'exact' },
  { label: 'Chat', href: '/chat', matchMode: 'startsWith' },
  { label: 'Memories', href: '/memories', matchMode: 'startsWith' },
  { label: 'Pricing', href: '/pricing', matchMode: 'startsWith' },
  { label: 'Account', href: '/account', matchMode: 'startsWith' },
  { label: 'Contact', matchMode: 'never', isContact: true },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function isActivePath(pathname: string, item: NavItem) {
  if (item.isContact || item.matchMode === 'never' || !item.href) return false;
  if (item.matchMode === 'exact') return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function BrandMark({ className }: { className?: string }) {
  const paw = (x: number, y: number, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx='6.1' cy='4.8' r='1.5' />
      <circle cx='9.1' cy='3.3' r='1.35' />
      <circle cx='12' cy='4.8' r='1.5' />
      <ellipse cx='9' cy='10' rx='3.45' ry='2.85' />
    </g>
  );

  return (
    <svg
      viewBox='0 0 32 32'
      aria-hidden='true'
      className={cn('h-[17px] w-[17px] shrink-0', className)}
      fill='currentColor'
    >
      <g transform='rotate(-18 16 16)'>
        {paw(2.5, 2.4, 0.84)}
        {paw(12.1, 11.3, 0.9)}
      </g>
    </svg>
  );
}

type ContactModalState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const INITIAL_CONTACT_STATE: ContactModalState = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

function ContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContactModalState>(INITIAL_CONTACT_STATE);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_CONTACT_STATE);
    }
  }, [open]);

  if (!open) return null;

  function updateField<K extends keyof ContactModalState>(key: K, value: ContactModalState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const composedSubject = form.subject?.trim() || 'EchoPaws Contact Request';
    const body = [
      form.name ? `Name: ${form.name}` : '',
      form.email ? `Email: ${form.email}` : '',
      '',
      form.message?.trim() || '',
    ]
      .filter(Boolean)
      .join('\n');

    const mailto = `mailto:${encodeURIComponent(
      SUPPORT_EMAIL
    )}?subject=${encodeURIComponent(composedSubject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    onClose();
  }

  return (
    <div className='fixed inset-0 z-[120] flex items-center justify-center px-4 py-8'>
      <button
        type='button'
        aria-label='Close contact modal backdrop'
        className='absolute inset-0 bg-black/55 backdrop-blur-[2px]'
        onClick={onClose}
      />

      <div className='relative z-[121] w-full max-w-[680px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1014] shadow-[0_30px_80px_rgba(0,0,0,0.48)]'>
        <div className='flex items-start justify-between gap-4 px-6 pb-2 pt-6 sm:px-7'>
          <div>
            <h2 className='text-[1.8rem] font-black tracking-[-0.04em] text-white'>
              Contact us
            </h2>
            <p className='mt-2 max-w-[460px] text-sm leading-7 text-white/68'>
              Leave your message here and we&apos;ll send it to support by email.
            </p>
          </div>

          <button
            type='button'
            aria-label='Close contact modal'
            className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white/72 transition hover:bg-white/10 hover:text-white'
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className='px-6 pb-6 pt-2 sm:px-7'>
          <div className='grid gap-4'>
            <label className='grid gap-2'>
              <span className='text-xs font-bold uppercase tracking-[0.14em] text-white/62'>
                Name
              </span>
              <input
                type='text'
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className='h-12 rounded-2xl border border-white/10 bg-white px-4 text-[15px] text-slate-900 outline-none transition focus:border-orange-300'
                placeholder='Your name'
              />
            </label>

            <label className='grid gap-2'>
              <span className='text-xs font-bold uppercase tracking-[0.14em] text-white/62'>
                Email
              </span>
              <input
                type='email'
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className='h-12 rounded-2xl border border-white/10 bg-white px-4 text-[15px] text-slate-900 outline-none transition focus:border-orange-300'
                placeholder='you@example.com'
              />
            </label>

            <label className='grid gap-2'>
              <span className='text-xs font-bold uppercase tracking-[0.14em] text-white/62'>
                Subject
              </span>
              <input
                type='text'
                value={form.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                className='h-12 rounded-2xl border border-white/10 bg-white px-4 text-[15px] text-slate-900 outline-none transition focus:border-orange-300'
                placeholder='Subject'
              />
            </label>

            <label className='grid gap-2'>
              <span className='text-xs font-bold uppercase tracking-[0.14em] text-white/62'>
                Message
              </span>
              <textarea
                value={form.message}
                onChange={(e) => updateField('message', e.target.value)}
                className='min-h-[120px] rounded-2xl border border-white/10 bg-[#1b1d22] px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/26 focus:border-orange-300'
                placeholder='Write your message here'
              />
            </label>
          </div>

          <button
            type='submit'
            className='mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(90deg,#ff4fa3_0%,#ff8a00_100%)] text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(255,120,80,0.25)] transition hover:brightness-105'
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export function SiteHeader({
  theme = 'dark',
  ctaLabel = 'Get Started',
  ctaHref = '/create-pet',
  className,
}: SiteHeaderProps) {
  const pathname = usePathname() || '/';
  const isDark = theme === 'dark';
  const [contactOpen, setContactOpen] = useState(false);

  const shellClassName = isDark
    ? 'fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(10,7,6,0.92)] backdrop-blur-xl'
    : 'fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(255,255,255,0.90)] backdrop-blur-xl';

  const navBaseClassName = isDark
    ? 'text-[rgba(255,244,230,0.72)] hover:text-white'
    : 'text-slate-600 hover:text-slate-950';

  const navActiveClassName = isDark
    ? 'border border-white/18 bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
    : 'border border-black/10 bg-black/5 text-slate-950';

  const signInClassName = isDark
    ? 'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white/88 transition hover:bg-white/10 hover:text-white'
    : 'inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50';

  const ctaClassName = isDark
    ? 'inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 px-4 py-2 text-sm font-bold text-white shadow-[0_12px_24px_rgba(249,115,22,0.30)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_28px_rgba(249,115,22,0.34)]'
    : 'inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-[1px]';

  const showSignIn = pathname !== '/login';
  const showCta = Boolean(ctaHref) && pathname !== ctaHref;

  const desktopNav = useMemo(
    () =>
      NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item);

        if (item.isContact) {
          return (
            <button
              key={item.label}
              type='button'
              onClick={() => setContactOpen(true)}
              className={cn(
                'rounded-full px-3 py-2 text-sm font-medium transition',
                navBaseClassName
              )}
            >
              {item.label}
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href!}
            className={cn(
              'rounded-full px-3 py-2 text-sm font-medium transition',
              active ? navActiveClassName : navBaseClassName
            )}
          >
            {item.label}
          </Link>
        );
      }),
    [pathname, navBaseClassName, navActiveClassName]
  );

  return (
    <>
      <header className={cn(shellClassName, className)}>
        <div className='mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8'>
          <div className='flex min-w-0 items-center gap-4'>
            <Link
              href='/'
              className='flex shrink-0 items-center gap-3'
              aria-label='EchoPaws Home'
            >
              <span className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[#3b281b] shadow-[0_10px_24px_rgba(249,115,22,0.32)]'>
                <BrandMark />
              </span>

              <span className='min-w-0 leading-none'>
                <span className='block truncate bg-gradient-to-r from-[#ffcf6d] via-[#ffb54d] to-[#ff8a1c] bg-clip-text text-[15px] font-black tracking-[-0.03em] text-transparent sm:text-[16px]'>
                  EchoPaws
                </span>
                <span className='mt-[5px] hidden text-[10px] font-medium uppercase tracking-[0.28em] text-white/78 sm:block'>
                  AI COMPANION
                </span>
              </span>
            </Link>

            <nav className='hidden items-center gap-2 md:flex'>{desktopNav}</nav>
          </div>

          <div className='flex shrink-0 items-center gap-2 sm:gap-3'>
            <nav className='flex items-center gap-1 md:hidden'>
              <Link
                href='/'
                className={cn(
                  'rounded-full px-3 py-2 text-xs font-semibold transition',
                  pathname === '/' ? navActiveClassName : navBaseClassName
                )}
              >
                Home
              </Link>

              <button
                type='button'
                onClick={() => setContactOpen(true)}
                className={cn('rounded-full px-3 py-2 text-xs font-semibold transition', navBaseClassName)}
              >
                Contact
              </button>
            </nav>

            {showSignIn ? (
              <Link href='/login' className={signInClassName}>
                Sign In
              </Link>
            ) : null}

            {showCta ? (
              <Link href={ctaHref} className={ctaClassName}>
                {ctaLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}

export default SiteHeader;
