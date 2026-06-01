import Link from 'next/link';

const CONTACT_HREF = 'mailto:YOUR_EMAIL_HERE';

type SiteHeaderProps = {
  ctaLabel?: string;
  ctaHref?: string;
};

export function SiteHeader({
  ctaLabel = 'Get Started',
  ctaHref = '/create-pet',
}: SiteHeaderProps) {
  return (
    <header className='border-b border-black/5 bg-white/80 backdrop-blur'>
      <div className='container-shell flex items-center justify-between gap-4 py-4'>
        <Link href='/' className='flex items-center gap-2 text-sm font-black text-slate-900'>
          <span className='text-lg'>🐾</span>
          <span>EchoPaws</span>
        </Link>

        <nav className='hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex lg:gap-6'>
          <Link href='/' className='transition hover:text-slate-900'>
            Home
          </Link>
          <Link href='/chat' className='transition hover:text-slate-900'>
            Chat
          </Link>
          <Link href='/memories' className='transition hover:text-slate-900'>
            Memories
          </Link>
          <Link href='/account' className='transition hover:text-slate-900'>
            Account
          </Link>
          <a
            href={CONTACT_HREF}
            className='transition hover:text-slate-900'
            aria-label='Contact EchoPaws support'
          >
            Contact
          </a>
        </nav>

        <div className='flex items-center gap-3'>
          <Link
            href='/login'
            className='rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50'
          >
            Sign In
          </Link>

          <Link
            href={ctaHref}
            className='rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600'
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
