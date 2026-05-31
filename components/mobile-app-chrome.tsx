'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';

function isCoreMobileAppRoute(pathname: string) {
  return (
    pathname.startsWith('/chat') ||
    pathname.startsWith('/memories') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/pets') ||
    pathname.startsWith('/create-pet')
  );
}

function HomeIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M3 10.5 12 3l9 7.5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M5.25 9.75V20a1 1 0 0 0 1 1H9.5v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V21h3.25a1 1 0 0 0 1-1V9.75'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M7 18.25H4.75A1.75 1.75 0 0 1 3 16.5v-9A1.75 1.75 0 0 1 4.75 5.75h14.5A1.75 1.75 0 0 1 21 7.5v9a1.75 1.75 0 0 1-1.75 1.75H11l-4 3v-3Z'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M12 3.5c4.97 0 9 3.36 9 7.5s-4.03 7.5-9 7.5S3 15.14 3 11 7.03 3.5 12 3.5Z'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M12 8.25v3l2.25 1.25'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M8.5 20.5h7' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M4.75 20a7.25 7.25 0 0 1 14.5 0'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export function MobileAppChrome() {
  const pathname = usePathname();
  const shouldShow = isCoreMobileAppRoute(pathname);

  useEffect(() => {
    const body = document.body;

    if (shouldShow) {
      body.classList.add('mobile-chrome-active');
    } else {
      body.classList.remove('mobile-chrome-active');
    }

    return () => {
      body.classList.remove('mobile-chrome-active');
    };
  }, [shouldShow]);

  const navItems = useMemo(
    () => [
      {
        href: '/',
        label: 'Home',
        active: pathname === '/',
        icon: <HomeIcon />,
      },
      {
        href: '/chat',
        label: 'Chat',
        active: pathname.startsWith('/chat'),
        icon: <ChatIcon />,
      },
      {
        href: '/memories',
        label: 'Memories',
        active: pathname.startsWith('/memories'),
        icon: <MemoryIcon />,
      },
      {
        href: '/account',
        label: 'Account',
        active: pathname.startsWith('/account'),
        icon: <AccountIcon />,
      },
    ],
    [pathname],
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <div className='mobile-app-topbar' aria-label='EchoPaws mobile top bar'>
        <div className='mobile-app-topbar__inner'>
          <Link href='/' className='mobile-app-topbar__brand'>
            <span className='mobile-app-topbar__paw'>🐾</span>
            <span>EchoPaws</span>
          </Link>

          <div className='mobile-app-topbar__spacer' aria-hidden='true' />
        </div>
      </div>

      <nav className='mobile-app-bottomnav' aria-label='Mobile navigation'>
        <div className='mobile-app-bottomnav__inner'>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-app-bottomnav__item${item.active ? ' is-active' : ''}`}
            >
              <span className='mobile-app-bottomnav__icon'>{item.icon}</span>
              <span className='mobile-app-bottomnav__label'>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
