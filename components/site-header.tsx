'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SiteHeaderTheme = 'dark' | 'light';

type SiteHeaderProps = {
  theme?: SiteHeaderTheme;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Chat', href: '/chat' },
  { label: 'Memories', href: '/memories' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Account', href: '/account' },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('h-4 w-4 shrink-0', className)}
      fill='currentColor'
    >
      <circle cx='7.5' cy='8' r='2.2' />
      <circle cx='12' cy='6.5' r='2.2' />
      <circle cx='16.5' cy='8' r='2.2' />
      <ellipse cx='12' cy='15.2' rx='5.4' ry='4.2' />
    </svg>
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

  const shellClassName = isDark
    ? 'fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(10,7,6,0.92)] backdrop-blur-xl'
    : 'fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(255,255,255,0.90)] backdrop-blur-xl';

  const brandTextClassName = isDark ? 'text-[#fff7ed]' : 'text-slate-950';

  const navBaseClassName = isDark
    ? 'text-[rgba(255,244,230,0.64)] hover:text-white'
    : 'text-slate-600 hover:text-slate-950';

  const navActiveClassName = isDark
    ? 'border border-white/12 bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
    : 'border border-black/10 bg-black/5 text-slate-950';

  const signInClassName = isDark
    ? 'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[rgba(255,244,230,0.88)] transition hover:bg-white/8 hover:text-white'
    : 'inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50';

  const ctaClassName = isDark
    ? 'inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 px-4 py-2 text-sm font-bold text-white shadow-[0_12px_24px_rgba(249,115,22,0.30)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_28px_rgba(249,115,22,0.34)]'
    : 'inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-[1px]';

  const showSignIn = pathname !== '/login';
  const showCta = ctaHref && pathname !== ctaHref;

  return (
    <header className={cn(shellClassName, className)}>
      <div className='mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8'>
        <div className='flex min-w-0 items-center gap-3 sm:gap-4'>
          <Link
            href='/'
            className='flex shrink-0 items-center gap-3'
            aria-label='EchoPaws Home'
          >
            <span
              className={cn(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-[0_10px_24px_rgba(249,115,22,0.30)]',
                isDark
                  ? 'bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[#2a1609]'
                  : 'bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[#2a1609]'
              )}
            >
              <BrandMark />
            </span>

            <span className='min-w-0 leading-none'>
              <span
                className={cn(
                  'block truncate text-[15px] font-black tracking-[-0.03em] sm:text-base',
                  brandTextClassName
                )}
              >
                EchoPaws
              </span>
              <span
                className={cn(
                  'mt-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] sm:block',
                  isDark ? 'text-white/38' : 'text-slate-400'
                )}
              >
                AI Companion
              </span>
            </span>
          </Link>

          <nav className='hidden items-center gap-2 md:flex'>
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);

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

        <div className='flex shrink-0 items-center gap-2 sm:gap-3'>
          <nav className='flex items-center gap-1 md:hidden'>
            {NAV_ITEMS.slice(0, 2).map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-3 py-2 text-xs font-semibold transition',
                    active ? navActiveClassName : navBaseClassName
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
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
  );
}

export default SiteHeader;
