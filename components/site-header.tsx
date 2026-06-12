'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ContactModal from '@/components/contact-modal';

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

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
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

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
