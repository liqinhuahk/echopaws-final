'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import EchoPawsLogo from '@/components/brand/EchoPawsLogo';

type SiteHeaderProps = {
  userName?: string;
  userEmail?: string;
  isLoggedIn?: boolean;
  forceActive?: '/' | '/chat' | '/memories' | '/account' | '/contact' | '/pricing';
  variant?: 'overlay' | 'solid';
  contactHref?: string;
};

type NavItem = {
  label: string;
  href: string;
};

function getNavItems(contactHref: string): NavItem[] {
  return [
    { label: 'Home', href: '/' },
    { label: 'Chat', href: '/chat' },
    { label: 'Memories', href: '/memories' },
    { label: 'Account', href: '/account' },
    { label: 'Contact', href: contactHref },
  ];
}

function isActivePath(
  pathname: string,
  href: string,
  forceActive?: string
) {
  if (forceActive) return forceActive === href;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export default function SiteHeader({
  userName,
  userEmail,
  isLoggedIn = false,
  forceActive,
  variant = 'solid',
  contactHref = '/contact',
}: SiteHeaderProps) {
  const pathname = usePathname() || '/';
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = getNavItems(contactHref);

  const headerClass =
    variant === 'overlay'
      ? 'absolute inset-x-0 top-0 z-40'
      : 'sticky top-0 z-40';

  const barClass =
    variant === 'overlay'
      ? 'border-b border-white/10 bg-[rgba(42,34,28,0.68)] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.20)]'
      : 'border-b border-white/10 bg-[rgba(28,20,14,0.92)] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.18)]';

  return (
    <header className={headerClass}>
      <div className={barClass}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[72px] items-center justify-between gap-4">
            <div className="shrink-0">
              <EchoPawsLogo href="/" size={40} textSize="sm" />
            </div>

            <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href, forceActive);

                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={`text-sm transition ${
                      active
                        ? 'rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white'
                        : 'text-white/72 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              {isLoggedIn ? (
                <>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-2 text-right">
                    <p className="max-w-[180px] truncate text-sm font-medium text-white">
                      {userName || 'Account'}
                    </p>
                    <p className="max-w-[180px] truncate text-[11px] text-white/50">
                      {userEmail || ''}
                    </p>
                  </div>

                  <Link
                    href="/account"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/14 bg-white/6 px-5 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Account
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/14 bg-white/6 px-5 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/pricing"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-full bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] px-5 text-sm font-semibold text-[#2a1707] transition hover:brightness-105"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
              aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-site-menu"
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>

          {mobileOpen && (
            <div
              id="mobile-site-menu"
              className="border-t border-white/10 py-4 lg:hidden"
            >
              <div className="grid gap-3">
                {navItems.map((item) => {
                  const active = isActivePath(pathname, item.href, forceActive);

                  return (
                    <Link
                      key={`${item.href}-${item.label}-mobile`}
                      href={item.href}
                      className={`flex min-h-[52px] items-center justify-between rounded-2xl px-4 text-base transition ${
                        active
                          ? 'border border-white/16 bg-white/10 text-white'
                          : 'border border-white/8 bg-white/[0.04] text-white/82 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-white/35">→</span>
                    </Link>
                  );
                })}

                <div className="mt-2 grid gap-3">
                  {isLoggedIn ? (
                    <>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                        <p className="truncate text-sm font-medium text-white">
                          {userName || 'Account'}
                        </p>
                        <p className="mt-1 truncate text-xs text-white/55">
                          {userEmail || ''}
                        </p>
                      </div>

                      <Link
                        href="/account"
                        className="flex min-h-[52px] items-center justify-center rounded-2xl border border-white/12 bg-white/6 px-4 text-base font-medium text-white transition hover:bg-white/10"
                      >
                        Account
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="flex min-h-[52px] items-center justify-center rounded-2xl border border-white/12 bg-white/6 px-4 text-base font-medium text-white transition hover:bg-white/10"
                      >
                        Sign In
                      </Link>

                      <Link
                        href="/pricing"
                        className="flex min-h-[52px] items-center justify-center rounded-2xl bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] px-4 text-base font-semibold text-[#2a1707] transition hover:brightness-105"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
