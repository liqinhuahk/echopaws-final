'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: React.ReactNode;
};

function HomeIcon() {
  return (
    <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M3 10.5 12 3l9 7.5' strokeLinecap='round' strokeLinejoin='round' />
      <path d='M5.25 9.75V20a1 1 0 0 0 1 1H9.5v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V21h3.25a1 1 0 0 0 1-1V9.75' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M7 18.25H4.75A1.75 1.75 0 0 1 3 16.5v-9A1.75 1.75 0 0 1 4.75 5.75h14.5A1.75 1.75 0 0 1 21 7.5v9a1.75 1.75 0 0 1-1.75 1.75H11l-4 3v-3Z' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M12 3.5c4.97 0 9 3.36 9 7.5s-4.03 7.5-9 7.5S3 15.14 3 11 7.03 3.5 12 3.5Z' strokeLinecap='round' strokeLinejoin='round' />
      <path d='M12 8.25v3l2.25 1.25' strokeLinecap='round' strokeLinejoin='round' />
      <path d='M8.5 20.5h7' strokeLinecap='round' />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' strokeLinecap='round' strokeLinejoin='round' />
      <path d='M4.75 20a7.25 7.25 0 0 1 14.5 0' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      href: '/',
      label: 'Home',
      match: (value) => value === '/',
      icon: <HomeIcon />,
    },
    {
      href: '/chat',
      label: 'Chat',
      match: (value) => value.startsWith('/chat'),
      icon: <ChatIcon />,
    },
    {
      href: '/memories',
      label: 'Memories',
      match: (value) => value.startsWith('/memories'),
      icon: <MemoryIcon />,
    },
    {
      href: '/account',
      label: 'Account',
      match: (value) => value.startsWith('/account'),
      icon: <AccountIcon />,
    },
  ];

  return (
    <nav
      className='fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/95 backdrop-blur md:hidden'
      aria-label='Mobile navigation'
    >
      <div className='mx-auto grid max-w-md grid-cols-4 gap-1 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2'>
        {items.map((item) => {
          const active = item.match(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex min-h-[58px] flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-bold transition',
                active
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              ].join(' ')}
            >
              <span className='mb-1'>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
