'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type ChatPetPayload = {
  activePetId: string | null;
  pets: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
    href: string;
  }>;
};

function shouldShowTopBar(path: string) {
  return (
    path === '/' ||
    path.startsWith('/chat') ||
    path.startsWith('/memories') ||
    path.startsWith('/account') ||
    path.startsWith('/pets') ||
    path.startsWith('/create-pet')
  );
}

function isCoreMobileAppRoute(path: string) {
  return (
    path === '/' ||
    path.startsWith('/chat') ||
    path.startsWith('/memories') ||
    path.startsWith('/account')
  );
}

function readChatPetsFromDom(): ChatPetPayload | null {
  if (typeof document === 'undefined') return null;
  const node = document.getElementById('mobile-chat-pets-data');
  if (!node?.textContent) return null;

  try {
    return JSON.parse(node.textContent) as ChatPetPayload;
  } catch {
    return null;
  }
}

function HomeIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
      <path d='M3 10.5 12 3l9 7.5' />
      <path d='M5 9.5V20h14V9.5' />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
      <path d='M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' />
    </svg>
  );
}

function MemoriesIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
      <path d='M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z' />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
      <path d='M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' />
      <path d='M4 20a8 8 0 0 1 16 0' />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      className={open ? 'is-open' : ''}
    >
      <path d='m6 9 6 6 6-6' />
    </svg>
  );
}

function PetThumb({
  name,
  imageUrl,
  size = 'sm',
}: {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md';
}) {
  const cls = size === 'md' ? 'mobile-pet-thumb mobile-pet-thumb--md' : 'mobile-pet-thumb';

  if (imageUrl) {
    return (
      <span className={cls}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className='mobile-pet-thumb__img' />
      </span>
    );
  }

  return <span className={`${cls} mobile-pet-thumb--fallback`}>🐾</span>;
}

function TopActionLink({
  href,
  children,
  tone = 'subtle',
}: {
  href: string;
  children: ReactNode;
  tone?: 'subtle' | 'brand';
}) {
  return (
    <Link
      href={href}
      className={`mobile-app-topbar__action ${
        tone === 'brand'
          ? 'mobile-app-topbar__action--brand'
          : 'mobile-app-topbar__action--subtle'
      }`}
    >
      {children}
    </Link>
  );
}

export function MobileAppChrome() {
  const pathname = usePathname();
  const shouldShow = isCoreMobileAppRoute(pathname);
  const showTopBar = shouldShowTopBar(pathname);
  const isChatPage = pathname.startsWith('/chat');
  const isMemoriesPage = pathname.startsWith('/memories');
  const isAccountPage = pathname.startsWith('/account');
  const isHomePage = pathname === '/';

  const [isOpen, setIsOpen] = useState(false);
  const [chatPetPayload, setChatPetPayload] = useState<ChatPetPayload | null>(null);
  const [optimisticPetId, setOptimisticPetId] = useState<string | null>(null);
  const [currentPetIdFromUrl, setCurrentPetIdFromUrl] = useState<string>('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.body.classList.toggle('mobile-chrome-active', shouldShow);
    document.body.classList.toggle('mobile-route-home', pathname === '/');
    document.body.classList.toggle('mobile-route-chat', pathname.startsWith('/chat'));
    document.body.classList.toggle('mobile-route-memories', pathname.startsWith('/memories'));
    document.body.classList.toggle('mobile-route-account', pathname.startsWith('/account'));

    return () => {
      document.body.classList.remove(
        'mobile-chrome-active',
        'mobile-route-home',
        'mobile-route-chat',
        'mobile-route-memories',
        'mobile-route-account'
      );
    };
  }, [pathname, shouldShow]);

  useEffect(() => {
    setIsOpen(false);

    if (typeof window !== 'undefined') {
      const value = new URLSearchParams(window.location.search).get('pet_id') ?? '';
      setCurrentPetIdFromUrl(value);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isChatPage) {
      setChatPetPayload(null);
      return;
    }

    const sync = () => {
      const payload = readChatPetsFromDom();
      if (payload) setChatPetPayload(payload);
    };

    sync();
    const timer = window.setInterval(sync, 500);

    return () => window.clearInterval(timer);
  }, [isChatPage]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const effectiveActivePetId = optimisticPetId ?? chatPetPayload?.activePetId ?? null;

  const activePet = useMemo(() => {
    if (!chatPetPayload?.pets?.length) return null;

    return (
      chatPetPayload.pets.find((pet) => pet.id === effectiveActivePetId) ?? chatPetPayload.pets[0]
    );
  }, [chatPetPayload, effectiveActivePetId]);

  const memoriesChatHref = currentPetIdFromUrl ? `/chat?pet_id=${currentPetIdFromUrl}` : '/chat';

  const topActions = useMemo(() => {
    if (isHomePage) {
      return (
        <div className='mobile-app-topbar__actions'>
          <TopActionLink href='/login'>Sign In</TopActionLink>
          <TopActionLink href='/create-pet' tone='brand'>
            Get Started
          </TopActionLink>
        </div>
      );
    }

    if (isAccountPage) {
      return (
        <div className='mobile-app-topbar__actions'>
          <TopActionLink href='/login'>Sign In</TopActionLink>
          <TopActionLink href='/pricing' tone='brand'>
            Upgrade to VIP
          </TopActionLink>
        </div>
      );
    }

    if (isMemoriesPage) {
      return (
        <div className='mobile-app-topbar__actions'>
          <TopActionLink href={memoriesChatHref}>Back to Chat</TopActionLink>
          <TopActionLink href='/pets' tone='brand'>
            Manage Pets
          </TopActionLink>
        </div>
      );
    }

    return null;
  }, [isHomePage, isAccountPage, isMemoriesPage, memoriesChatHref]);

  const navItems = useMemo(
    () => [
      { href: '/', label: 'Home', icon: <HomeIcon />, active: pathname === '/' },
      { href: '/chat', label: 'Chat', icon: <ChatIcon />, active: pathname.startsWith('/chat') },
      {
        href: '/memories',
        label: 'Memories',
        icon: <MemoriesIcon />,
        active: pathname.startsWith('/memories'),
      },
      {
        href: '/account',
        label: 'Account',
        icon: <AccountIcon />,
        active: pathname.startsWith('/account'),
      },
    ],
    [pathname]
  );

  if (!shouldShow) return null;

  return (
    <>
      {showTopBar ? (
        <div className='mobile-app-topbar' aria-label='EchoPaws mobile top bar'>
          <Link href='/' className='mobile-app-topbar__brand'>
            <span className='mobile-app-topbar__paw'>🐾</span>
            <span>EchoPaws</span>
          </Link>

          {isChatPage && activePet ? (
            <div ref={containerRef} className='mobile-app-pet-switcher'>
              <button
                type='button'
                className='mobile-app-pet-switcher__trigger'
                onClick={() => setIsOpen((prev) => !prev)}
              >
                <PetThumb name={activePet.name} imageUrl={activePet.imageUrl} size='sm' />
                <span className='mobile-app-pet-switcher__name'>{activePet.name}</span>
                <ChevronDownIcon open={isOpen} />
              </button>

              {isOpen ? (
                <>
                  <button
                    type='button'
                    aria-label='Close pet switcher'
                    className='mobile-app-pet-switcher__backdrop'
                    onClick={() => setIsOpen(false)}
                  />
                  <div className='mobile-app-pet-switcher__menu'>
                    {chatPetPayload?.pets.map((pet) => {
                      const isActive = pet.id === effectiveActivePetId;

                      return (
                        <Link
                          key={pet.id}
                          href={pet.href}
                          className={`mobile-app-pet-switcher__item ${
                            isActive ? 'is-active' : ''
                          }`}
                          onClick={() => {
                            setOptimisticPetId(pet.id);
                            setIsOpen(false);
                          }}
                        >
                          <PetThumb name={pet.name} imageUrl={pet.imageUrl} size='md' />
                          <span className='mobile-app-pet-switcher__label'>{pet.name}</span>
                          {isActive ? (
                            <span className='mobile-app-pet-switcher__current'>Current AI Pet</span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            topActions
          )}
        </div>
      ) : null}

      <nav className='mobile-app-bottomnav'>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-app-bottomnav__item ${item.active ? 'is-active' : ''}`}
          >
            <span className='mobile-app-bottomnav__icon'>{item.icon}</span>
            <span className='mobile-app-bottomnav__label'>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
