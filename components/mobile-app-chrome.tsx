'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type ChatPetItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  href: string;
};

type ChatPetPayload = {
  activePetId: string | null;
  pets: ChatPetItem[];
};

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

function PetThumb({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  if (imageUrl) {
    return (
      <span className='inline-flex h-7 w-7 shrink-0 overflow-hidden rounded-full border border-orange-100 bg-orange-50'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`${name} avatar`} className='h-full w-full object-cover' />
      </span>
    );
  }

  return (
    <span className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-[13px]'>
      🐾
    </span>
  );
}

function readChatPetsFromDom(): ChatPetPayload | null {
  const el = document.getElementById('mobile-chat-pets-data');
  const raw = el?.textContent?.trim();

  if (!raw) return null;

  try {
    return JSON.parse(raw) as ChatPetPayload;
  } catch {
    return null;
  }
}

export function MobileAppChrome() {
  const pathname = usePathname();
  const shouldShow = isCoreMobileAppRoute(pathname);
  const isChatPage = pathname.startsWith('/chat');

  const [chatPetPayload, setChatPetPayload] = useState<ChatPetPayload | null>(null);

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

  useEffect(() => {
    if (!isChatPage) {
      setChatPetPayload(null);
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;

    const timer = window.setInterval(() => {
      const payload = readChatPetsFromDom();

      if (payload || attempts >= maxAttempts) {
        setChatPetPayload(payload);
        window.clearInterval(timer);
      }

      attempts += 1;
    }, 120);

    return () => {
      window.clearInterval(timer);
    };
  }, [isChatPage, pathname]);

  const activePet = useMemo(() => {
    if (!chatPetPayload?.pets?.length) return null;
    return (
      chatPetPayload.pets.find((pet) => pet.id === chatPetPayload.activePetId) ??
      chatPetPayload.pets[0]
    );
  }, [chatPetPayload]);

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
            <span>EchoPaws V2</span>
          </Link>

          {isChatPage && activePet ? (
            <details className='relative'>
              <summary className='flex list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-800 shadow-sm'>
                <PetThumb name={activePet.name} imageUrl={activePet.imageUrl} />
                <span className='max-w-[88px] truncate'>{activePet.name}</span>
                <span className='text-[10px] text-slate-400'>▾</span>
              </summary>

              <div className='absolute right-0 top-[calc(100%+8px)] z-[80] w-[220px] rounded-[18px] border border-slate-200 bg-white p-2 shadow-xl'>
                <div className='px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700'>
                  Switch Pet
                </div>

                <div className='grid gap-2'>
                  {chatPetPayload?.pets.map((pet) => {
                    const isActive = pet.id === chatPetPayload.activePetId;

                    return (
                      <Link
                        key={pet.id}
                        href={pet.href}
                        className={[
                          'flex items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 transition',
                          isActive ? 'bg-orange-50 text-orange-900' : 'hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <div className='flex min-w-0 items-center gap-3'>
                          <PetThumb name={pet.name} imageUrl={pet.imageUrl} />
                          <span className='truncate text-sm font-bold text-slate-800'>
                            {pet.name}
                          </span>
                        </div>

                        {isActive ? (
                          <span className='rounded-full bg-orange-600 px-2 py-1 text-[10px] font-bold text-white'>
                            Active
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </details>
          ) : (
            <div className='mobile-app-topbar__spacer' aria-hidden='true' />
          )}
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
