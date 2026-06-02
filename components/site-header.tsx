'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CONTACT_HREF = '/contact';

type SiteHeaderProps = {
  ctaLabel?: string;
  ctaHref?: string;
  theme?: 'light' | 'dark';
};

function isRouteLink(href: string) {
  return href.startsWith('/');
}

export function SiteHeader({
  ctaLabel = 'Get Started',
  ctaHref = '/create-pet',
  theme = 'light',
}: SiteHeaderProps) {
  const pathname = usePathname();
  const isDark = theme === 'dark';

  const headerClassName = isDark
    ? 'border-b border-white/10 bg-black/20 backdrop-blur-md'
    : 'border-b border-black/5 bg-white/80 backdrop-blur';

  const brandTextClassName = isDark
    ? 'bg-gradient-to-r from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-lg font-black tracking-[-0.03em] text-transparent md:text-xl'
    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 bg-clip-text text-lg font-black tracking-[-0.03em] text-transparent md:text-xl';

  const pawWrapClassName = isDark
    ? 'grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[1.08rem] shadow-[0_10px_24px_rgba(249,115,22,0.35)] md:h-12 md:w-12 md:text-[1.16rem]'
    : 'grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[1.08rem] shadow-[0_8px_18px_rgba(249,115,22,0.22)] md:h-12 md:w-12 md:text-[1.16rem]';

  const signInClassName = isDark
    ? 'rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/16 active:bg-white/20'
    : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:bg-orange-50 active:text-orange-700';

  const ctaClassName =
    'rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 active:bg-orange-700';

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Chat', href: '/chat' },
    { label: 'Memories', href: '/memories' },
    { label: 'Account', href: '/account' },
    { label: 'Contact', href: CONTACT_HREF },
  ];

  function isActive(href: string) {
    if (!isRouteLink(href)) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function getNavLinkClass(active: boolean) {
    if (isDark) {
      return active
        ? 'rounded-full border border-white/14 bg-white/12 px-3.5 py-1.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm transition'
        : 'rounded-full px-3.5 py-1.5 text-sm font-semibold text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] transition hover:bg-white/10 hover:text-orange-200 active:bg-white/14 active:text-orange-200';
    }

    return active
      ? 'rounded-full bg-orange-50 px-3.5 py-1.5 text-sm font-bold text-orange-700 shadow-sm transition'
      : 'rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-700 active:bg-orange-100 active:text-orange-700';
  }

  return (
    <header className={headerClassName}>
      <div className='container-shell flex items-center justify-between gap-4 py-4'>
        <Link href='/' className='flex items-center gap-3'>
          <span className={pawWrapClassName} aria-hidden='true'>
            🐾
          </span>
          <span className={brandTextClassName}>EchoPaws</span>
        </Link>

        <nav className='hidden items-center gap-4 md:flex lg:gap-5'>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const className = getNavLinkClass(active);

            if (isRouteLink(item.href)) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={className}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <a
                key={item.href}
                href={item.href}
                className={className}
                aria-label='Contact EchoPaws support'
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className='flex items-center gap-3'>
          <Link href='/login' className={signInClassName}>
            Sign In
          </Link>

          <Link href={ctaHref} className={ctaClassName}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
