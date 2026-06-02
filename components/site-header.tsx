import Link from 'next/link';

const CONTACT_HREF = 'mailto:YOUR_EMAIL_HERE';

type SiteHeaderProps = {
  ctaLabel?: string;
  ctaHref?: string;
  theme?: 'light' | 'dark';
};

export function SiteHeader({
  ctaLabel = 'Get Started',
  ctaHref = '/create-pet',
  theme = 'light',
}: SiteHeaderProps) {
  const isDark = theme === 'dark';

  const headerClassName = isDark
    ? 'border-b border-white/10 bg-black/20 backdrop-blur-md'
    : 'border-b border-black/5 bg-white/80 backdrop-blur';

  const navLinkClassName = isDark
    ? 'transition text-white/75 hover:text-white'
    : 'transition text-slate-600 hover:text-slate-900';

  const signInClassName = isDark
    ? 'rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/16'
    : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50';

  const brandTextClassName = isDark
    ? 'bg-gradient-to-r from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-sm font-black tracking-[-0.03em] text-transparent md:text-base'
    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 bg-clip-text text-sm font-black tracking-[-0.03em] text-transparent md:text-base';

  const pawWrapClassName = isDark
    ? 'grid h-9 w-9 place-items-center rounded-[12px] bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[1rem] shadow-[0_10px_24px_rgba(249,115,22,0.35)]'
    : 'grid h-9 w-9 place-items-center rounded-[12px] bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[1rem] shadow-[0_8px_18px_rgba(249,115,22,0.22)]';

  const ctaClassName = isDark
    ? 'rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600'
    : 'rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600';

  return (
    <header className={headerClassName}>
      <div className='container-shell flex items-center justify-between gap-4 py-4'>
        <Link href='/' className='flex items-center gap-3'>
          <span className={pawWrapClassName} aria-hidden='true'>
            🐾
          </span>
          <span className={brandTextClassName}>EchoPaws</span>
        </Link>

        <nav className='hidden items-center gap-5 text-sm font-medium md:flex lg:gap-6'>
          <Link href='/' className={navLinkClassName}>
            Home
          </Link>
          <Link href='/chat' className={navLinkClassName}>
            Chat
          </Link>
          <Link href='/memories' className={navLinkClassName}>
            Memories
          </Link>
          <Link href='/account' className={navLinkClassName}>
            Account
          </Link>
          <a
            href={CONTACT_HREF}
            className={navLinkClassName}
            aria-label='Contact EchoPaws support'
          >
            Contact
          </a>
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
