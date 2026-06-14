'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EchoPawsLogo from '@/components/brand/EchoPawsLogo';

type SiteHeaderProps = {
  userName?: string;
  userEmail?: string;
  isLoggedIn?: boolean;
  forceActive?: '/' | '/chat' | '/memories' | '/pricing' | '/account' | '/contact';
};

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Chat', href: '/chat' },
  { label: 'Memories', href: '/memories' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Account', href: '/account' },
  { label: 'Contact', href: '/account' },
];

function isItemActive(
  pathname: string,
  href: string,
  forceActive?: SiteHeaderProps['forceActive']
) {
  if (forceActive) {
    return forceActive === href;
  }

  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader({
  userName,
  userEmail,
  isLoggedIn = false,
  forceActive,
}: SiteHeaderProps) {
  const pathname = usePathname() || '/';

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto max-w-7xl px-6 pt-5 lg:px-8">
        <div className="border-b border-white/10 bg-[rgba(42,34,28,0.68)] shadow-[0_18px_60px_rgba(0,0,0,0.20)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-6 px-6 py-4">
            <div className="shrink-0">
              <EchoPawsLogo href="/" size={40} textSize="sm" />
            </div>

            <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(pathname, item.href, forceActive);

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
                    className="rounded-full border border-white/14 bg-white/6 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Account
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full border border-white/14 bg-white/6 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/pricing"
                    className="rounded-full bg-gradient-to-r from-[#f8bd69] to-[#f59e0b] px-5 py-2 text-sm font-semibold text-[#2a1707] transition hover:brightness-105"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto px-6 pb-4 lg:hidden">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(pathname, item.href, forceActive);

              return (
                <Link
                  key={`${item.href}-${item.label}-mobile`}
                  href={item.href}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? 'border border-white/16 bg-white/10 text-white'
                      : 'border border-transparent bg-white/4 text-white/72 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
