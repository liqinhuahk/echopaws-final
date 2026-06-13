'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EchoPawsLogo from '@/components/brand/EchoPawsLogo';

type SiteHeaderProps = {
  userName?: string;
  userEmail?: string;
  isLoggedIn?: boolean;
};

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Chat', href: '/chat' },
  { label: 'Memories', href: '/memories' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Account', href: '/account' },
  { label: 'Contact', href: '/account' },
];

export default function SiteHeader({
  userName,
  userEmail,
  isLoggedIn = false,
}: SiteHeaderProps) {
  const pathname = usePathname() || '/';

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(16,8,4,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <EchoPawsLogo href="/" size={44} textSize="md" />

        <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition ${
                  isActive ? 'text-white' : 'text-white/72 hover:text-white'
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
                <p className="text-sm font-medium text-white">{userName || 'Account'}</p>
                <p className="text-[11px] text-white/50">{userEmail || ''}</p>
              </div>
              <Link
                href="/account"
                className="rounded-full border border-white/14 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
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
    </header>
  );
}
