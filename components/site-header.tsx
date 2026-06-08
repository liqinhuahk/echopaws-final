'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContactModal } from '@/components/contact-modal-provider';

type NavItem = {
  label: string;
  href: string;
  isContact?: boolean;
};

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
  theme = 'dark',
}: SiteHeaderProps) {
  const pathname = usePathname();
  const { openContactModal } = useContactModal();
  const isDark = theme === 'dark';

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Chat', href: '/chat' },
    { label: 'Memories', href: '/memories' },
    { label: 'Account', href: '/account' },
    { label: 'Contact', href: '#contact', isContact: true },
  ];

  function isActive(href: string) {
    if (!isRouteLink(href)) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function getNavLinkClass(active: boolean) {
    if (isDark) {
      return active
        ? 'inline-flex h-9 items-center rounded-full border border-white/18 bg-white/12 px-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition'
        : 'inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold text-white/92 transition hover:bg-white/10 hover:text-orange-200 active:bg-white/14';
    }

    return active
      ? 'inline-flex h-9 items-center rounded-full bg-orange-50 px-3.5 text-sm font-bold text-orange-700 shadow-sm transition'
      : 'inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-700 active:bg-orange-100';
  }

  const headerShellClassName = isDark
    ? 'border-b border-white/8 bg-[linear-gradient(90deg,#120a07_0%,#1a100c_48%,#120a07_100%)] shadow-[0_12px_30px_rgba(0,0,0,0.34)]'
    : 'border-b border-[#eadfd2] bg-[#fffaf5] shadow-[0_10px_24px_rgba(15,23,42,0.08)]';

  const brandTextClassName = isDark
    ? 'bg-gradient-to-r from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-lg font-black tracking-[-0.03em] text-transparent md:text-xl'
    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 bg-clip-text text-lg font-black tracking-[-0.03em] text-transparent md:text-xl';

  const pawWrapClassName = isDark
    ? 'grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[1.05rem] shadow-[0_10px_24px_rgba(249,115,22,0.32)]'
    : 'grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[1.05rem] shadow-[0_8px_18px_rgba(249,115,22,0.20)]';

  const signInClassName = isDark
    ? 'inline-flex h-10 items-center rounded-full border border-white/16 bg-white/8 px-4 text-sm font-bold text-white transition hover:bg-white/14 active:bg-white/18'
    : 'inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:bg-orange-50';

  const ctaClassName =
    'inline-flex h-10 items-center rounded-full bg-orange-500 px-4 text-sm font-bold text-white shadow-[0_10px_20px_rgba(249,115,22,0.22)] transition hover:bg-orange-600 active:bg-orange-700';

  return (
    <>
      <div className='hidden h-[76px] md:block' aria-hidden='true' />

      <header className='fixed inset-x-0 top-0 z-[120] hidden md:block'>
        <div className={headerShellClassName}>
          <div className='container-shell flex min-h-[76px] items-center justify-between gap-4'>
            <Link href='/' className='flex items-center gap-3'>
              <span className={pawWrapClassName} aria-hidden='true'>
                🐾
              </span>
              <span className={brandTextClassName}>EchoPaws</span>
            </Link>

            <nav className='hidden items-center gap-3 md:flex lg:gap-4'>
              {navItems.map((item) => {
                const active = item.isContact ? false : isActive(item.href);
                const className = getNavLinkClass(active);

                if (item.isContact) {
                  return (
                    <button
                      key='contact-modal-trigger'
                      type='button'
                      onClick={openContactModal}
                      className={`${className} cursor-pointer border-0 bg-transparent`}
                      aria-label='Contact EchoPaws support'
                    >
                      {item.label}
                    </button>
                  );
                }

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
        </div>
      </header>
    </>
  );
}

export default SiteHeader;
