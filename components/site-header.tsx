'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type SiteHeaderTheme = 'dark' | 'light';

type SiteHeaderProps = {
  theme?: SiteHeaderTheme;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

type NavItem = {
  label: string;
  href: string;
  matchMode?: 'exact' | 'startsWith';
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', matchMode: 'exact' },
  { label: 'Chat', href: '/chat', matchMode: 'startsWith' },
  { label: 'Memories', href: '/memories', matchMode: 'startsWith' },
  { label: 'Pricing', href: '/pricing', matchMode: 'startsWith' },
  { label: 'Account', href: '/account', matchMode: 'startsWith' },
  { label: 'Contact', href: '/#contact', matchMode: 'exact' },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function isActivePath(pathname: string, item: NavItem) {
  if (item.matchMode === 'exact') return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function BrandMark() {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ffb45e_0%,#ff9330_45%,#ff7a1a_100%)] text-[#2b170a] shadow-[0_12px_24px_rgba(249,115,22,0.28)]">
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-[18px] w-[18px]" fill="currentColor">
        <g transform="rotate(-18 16 16)">
          <g transform="translate(2.5 2.4) scale(0.84)">
            <circle cx="6.1" cy="4.8" r="1.5" />
            <circle cx="9.1" cy="3.3" r="1.35" />
            <circle cx="12" cy="4.8" r="1.5" />
            <ellipse cx="9" cy="10" rx="3.45" ry="2.85" />
          </g>
          <g transform="translate(12.1 11.3) scale(0.9)">
            <circle cx="6.1" cy="4.8" r="1.5" />
            <circle cx="9.1" cy="3.3" r="1.35" />
            <circle cx="12" cy="4.8" r="1.5" />
            <ellipse cx="9" cy="10" rx="3.45" ry="2.85" />
          </g>
        </g>
      </svg>
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = theme === 'dark';

  const shellClassName = isDark
    ? 'fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[rgba(9,6,5,0.82)] backdrop-blur-xl'
    : 'fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(255,255,255,0.88)] backdrop-blur-xl';

  const navBaseClassName = isDark
    ? 'text-[rgba(255,244,230,0.72)] hover:text-white'
    : 'text-slate-600 hover:text-slate-950';

  const navActiveClassName = isDark
    ? 'border border-white/14 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
    : 'border border-black/10 bg-black/5 text-slate-950';

  const signInClassName = isDark
    ? 'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/[0.08] hover:text-white'
    : 'inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50';

  const ctaClassName = isDark
    ? 'inline-flex items-center justify-center rounded-full bg-[linear-gradient(90deg,#ffb45e_0%,#ff9330_50%,#ff7a1a_100%)] px-4 py-2 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(249,115,22,0.26)] transition hover:-translate-y-[1px] hover:brightness-105'
    : 'inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-[1px]';

  const showSignIn = pathname !== '/login';
  const showCta = Boolean(ctaHref) && pathname !== ctaHref;

  return (
    <header className={cn(shellClassName, className)}>
      <div className="mx-auto flex h-[76px] w-full max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="EchoPaws Home">
            <BrandMark />
            <div className="min-w-0 leading-none">
              <div
                className="truncate text-[15px] font-black tracking-[-0.03em] text-white sm:text-[16px]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                EchoPaws
              </div>
              <div className="mt-[5px] hidden text-[10px] font-medium uppercase tracking-[0.28em] text-white/68 sm:block">
                AI COMPANION
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-3 py-2 text-sm font-medium transition',
                    active ? navActiveClassName : navBaseClassName
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {showSignIn ? (
            <Link href="/login" className={signInClassName}>
              Sign In
            </Link>
          ) : null}

          {showCta ? (
            <Link href={ctaHref} className={ctaClassName}>
              {ctaLabel}
            </Link>
          ) : null}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white md:hidden"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/8 bg-[rgba(9,6,5,0.94)] px-4 pb-4 pt-3 md:hidden">
          <nav className="grid gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm font-medium transition',
                    active
                      ? 'border border-white/14 bg-white/[0.06] text-white'
                      : 'border border-transparent text-[rgba(255,244,230,0.76)] hover:border-white/8 hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default SiteHeader;
