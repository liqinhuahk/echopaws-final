'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SiteHeaderProps = {
  ctaLabel?: string;
  ctaHref?: string;
  theme?: 'light' | 'dark';
};

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'Chat' },
  { href: '/memories', label: 'Memories' },
  { href: '/account', label: 'Account' },
  { href: '/#contact', label: 'Contact' },
];

function PawMark() {
  return (
    <span className='inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[14px] shadow-[0_10px_20px_rgba(249,115,22,0.28)]'>
      🐾
    </span>
  );
}

export function SiteHeader({
  ctaLabel = 'Get Started',
  ctaHref = '/create-pet',
  theme = 'dark',
}: SiteHeaderProps) {
  const pathname = usePathname();
  const isDark = theme === 'dark';

  const headerShellClassName = isDark
    ? 'fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(10,7,6,0.94)] backdrop-blur-xl'
    : 'fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(255,255,255,0.92)] backdrop-blur-xl';

  const brandTextClassName = isDark ? 'text-[#fff7ed]' : 'text-slate-950';

  const navClassName = isDark
    ? 'text-[rgba(255,244,230,0.62)] hover:text-white'
    : 'text-slate-600 hover:text-slate-950';

  const activeNavClassName = isDark
    ? 'border border-white/14 bg-white/8 text-white'
    : 'border border-black/10 bg-black/5 text-slate-950';

  const signInClassName = isDark
    ? 'border border-white/16 bg-transparent text-white hover:bg-white/8'
    : 'border border-black/10 bg-white text-slate-950 hover:bg-slate-50';

  return (
    <>
      <header className={headerShellClassName}>
        <div className='container-shell'>
          <div className='flex h-[76px] items-center justify-between gap-4'>
            <Link href='/' className='flex min-w-0 items-center gap-3'>
              <PawMark />
              <span className={`truncate text-[1.15rem] font-black tracking-[-0.03em] ${brandTextClassName}`}>
                EchoPaws
              </span>
            </Link>

            <nav className='hidden items-center gap-2 md:flex'>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : item.href !== '/#contact' && pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex min-h-[36px] items-center rounded-full px-4 text-[0.88rem] font-semibold transition ${
                      isActive ? activeNavClassName : navClassName
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className='flex items-center gap-3'>
              <Link
                href='/login'
                className={`inline-flex min-h-[40px] items-center justify-center rounded-full px-5 text-[0.88rem] font-bold transition ${signInClassName}`}
              >
                Sign In
              </Link>

              <Link href={ctaHref} className='brand-button min-h-[40px] px-5 text-[0.88rem]'>
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div aria-hidden='true' className='h-[76px]' />
    </>
  );
}

export default SiteHeader;
