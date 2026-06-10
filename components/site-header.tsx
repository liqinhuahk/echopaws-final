'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SiteHeaderProps = {
  theme?: 'dark' | 'light';
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

type NavItem = {
  label: string;
  href: string;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', exact: true },
  { label: 'Chat', href: '/chat' },
  { label: 'Memories', href: '/memories' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Account', href: '/account' },
  { label: 'Contact', href: '/#contact', exact: false },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function isActivePath(pathname: string, item: NavItem) {
  if (item.href === '/#contact') return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 32 32'
      aria-hidden='true'
      className={cn('h-5 w-5 shrink-0 text-[#2f180b]', className)}
      fill='currentColor'
    >
      <g transform='rotate(-16 16 16)'>
        <circle cx='10' cy='9' r='2.15' />
        <circle cx='15.2' cy='6.7' r='2' />
        <circle cx='20.1' cy='8.9' r='2.15' />
        <ellipse cx='15.3' cy='17.8' rx='5.5' ry='4.7' />
      </g>
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
    : 'fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(255,255,255,0.92)] backdrop-blur-xl';

  const brandTextClass = isDark ? 'text-[#ffb14d]' : 'text-[#f28a1f]';
  const navBaseClass = isDark
    ? 'text-[rgba(255,244,230,0.72)] hover:text-white'
    : 'text-[rgba(38,24,16,0.72)] hover:text-[#1f140d]';

  const navActiveClass = isDark
    ? 'border-white/20 bg-white/[0.06] text-white shadow-[0_8px_22px_rgba(0,0,0,0.18)]'
    : 'border-black/10 bg-black/[0.04] text-[#1f140d] shadow-[0_8px_22px_rgba(0,0,0,0.08)]';

  const signInClass = isDark
    ? 'border-white/16 bg-transparent text-white hover:bg-white/[0.05]'
    : 'border-black/10 bg-white text-[#1f140d] hover:bg-black/[0.03]';

  const ctaClass =
    'bg-[linear-gradient(135deg,#ffb33a_0%,#ff8a1f_100%)] text-white shadow-[0_10px_24px_rgba(249,115,22,0.30)] hover:-translate-y-[1px] hover:brightness-105';

  const showSignIn = pathname !== '/login';
  const showCTA = pathname !== ctaHref;

  return (
    <header className={cn(shellClassName, className)}>
      <div className='mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-4 px-4 md:h-[78px] md:px-8'>
        {/* Brand */}
        <Link href='/' className='flex shrink-0 items-center gap-3'>
          <span className='inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 shadow-[0_10px_24px_rgba(249,115,22,0.28)]'>
            <BrandMark />
          </span>

          <span className='flex flex-col leading-none'>
            <span className={cn('text-base font-black tracking-[-0.03em]', brandTextClass)}>
              EchoPaws
            </span>
            <span
              className={cn(
                'mt-1 text-[0.56rem] font-bold uppercase tracking-[0.28em]',
                isDark ? 'text-[rgba(255,244,230,0.58)]' : 'text-[rgba(38,24,16,0.48)]'
              )}
            >
              AI COMPANION
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className='hidden min-w-0 flex-1 items-center justify-center md:flex'>
          <div className='flex items-center gap-1.5'>
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item);

              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className={cn(
                    'inline-flex min-h-[38px] items-center justify-center rounded-full border px-4 text-[0.82rem] font-bold transition',
                    active
                      ? navActiveClass
                      : cn(
                          'border-transparent bg-transparent',
                          navBaseClass,
                          isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'
                        )
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right actions */}
        <div className='flex shrink-0 items-center gap-2 md:gap-3'>
          {showSignIn ? (
            <Link
              href='/login'
              className={cn(
                'inline-flex min-h-[42px] items-center justify-center rounded-full border px-4 text-sm font-extrabold transition md:px-5',
                signInClass
              )}
            >
              Sign In
            </Link>
          ) : null}

          {showCTA ? (
            <Link
              href={ctaHref}
              className={cn(
                'inline-flex min-h-[42px] items-center justify-center rounded-full px-4 text-sm font-extrabold transition md:px-5',
                ctaClass
              )}
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Mobile quick nav */}
      <div className='border-t border-white/6 md:hidden'>
        <div className='mx-auto flex w-full max-w-[1200px] items-center gap-2 overflow-x-auto px-4 py-2.5'>
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const active = isActivePath(pathname, item);

            return (
              <Link
                key={`mobile-${item.label}-${item.href}`}
                href={item.href}
                className={cn(
                  'inline-flex shrink-0 min-h-[34px] items-center justify-center rounded-full border px-3 text-[0.76rem] font-bold transition',
                  active
                    ? navActiveClass
                    : cn(
                        'border-transparent bg-transparent',
                        navBaseClass,
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'
                      )
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href='/#contact'
            className={cn(
              'inline-flex shrink-0 min-h-[34px] items-center justify-center rounded-full border px-3 text-[0.76rem] font-bold transition',
              isDark
                ? 'border-white/10 text-[rgba(255,244,230,0.72)] hover:bg-white/[0.04] hover:text-white'
                : 'border-black/8 text-[rgba(38,24,16,0.72)] hover:bg-black/[0.04] hover:text-[#1f140d]'
            )}
          >
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
