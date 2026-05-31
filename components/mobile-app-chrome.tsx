'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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

function isCoreMobileAppRoute(path: string) {
  return ['/chat', '/memories', '/account', '/pets', '/create-pet'].some((route) =>
    path.startsWith(route)
  );
}

function HomeIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9' aria-hidden='true'>
      <path d='M3 10.8 12 4l9 6.8' />
      <path d='M5.5 9.8V20h13V9.8' />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9' aria-hidden='true'>
      <path d='M6 18.5c-1.1 0-2-.9-2-2v-9c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H9l-4.5 3v-3H6Z' />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9' aria-hidden='true'>
      <path d='M12 21s-6.8-4.35-9.15-8A5.55 5.55 0 0 1 12 6.2 5.55 5.55 0 0 1 21.15 13C18.8 16.65 12 21 12 21Z' />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9' aria-hidden='true'>
      <path d='M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' />
      <path d='M4 20a8 8 0 0 1 16 0' />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox='0 0 20 20'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      aria-hidden='true'
      className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
    >
      <path d='m5 7.5 5 5 5-5' />
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
  const className =
    size === 'md'
      ? 'h-9 w-9 rounded-full'
      : 'h-8 w-8 rounded-full';

  if (imageUrl) {
    return (
      <div className={`${className} overflow-hidden border border-orange-100 bg-orange-50`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`${name} avatar`} className='h-full w-full object-cover' />
      </div>
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center border border-orange-100 bg-orange-100 text-[13px] text-orange-900`}
      aria-label={`${name} avatar placeholder`}
    >
      🐾
    </div>
  );
}

function readChatPetsFromDom(): ChatPetPayload | null {
  if (typeof document === 'undefined') return null;

  const el = document.getElementById('mobile-chat-pets-data');
  if (!el?.textContent) return null;

  try {
    const parsed = JSON.parse(el.textContent) as ChatPetPayload;

    if (!parsed || !Array.isArray(parsed.pets)) return null;

    return {
      activePetId: parsed.activePetId ?? null,
      pets: parsed.pets.map((pet) => ({
        id: String(pet.id),
        name: String(pet.name),
        imageUrl: pet.imageUrl ?? null,
        href: String(pet.href),
      })),
    };
  } catch {
    return null;
  }
}

export function MobileAppChrome() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldShow = isCoreMobileAppRoute(pathname);
  const isChatPage = pathname.startsWith('/chat');

  const [isOpen, setIsOpen] = useState(false);
  const [chatPetPayload, setChatPetPayload] = useState<ChatPetPayload | null>(null);

  const queryKey = searchParams?.toString() ?? '';

  useEffect(() => {
    if (!shouldShow) {
      document.body.classList.remove('mobile-chrome-active');
      return;
    }

    document.body.classList.add('mobile-chrome-active');

    return () => {
      document.body.classList.remove('mobile-chrome-active');
    };
  }, [shouldShow]);

  // 路由或 query 改变时，自动收回下拉
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, queryKey]);

  // 在 chat 页面上，路径或 pet_id 变化后重新读取当前 pet 数据
  useEffect(() => {
    if (!isChatPage) {
      setChatPetPayload(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const syncFromDom = () => {
      if (cancelled) return;

      const payload = readChatPetsFromDom();
      if (payload) {
        setChatPetPayload(payload);
        return;
      }

      attempts += 1;
      if (attempts < 24) {
        window.setTimeout(syncFromDom, 120);
      }
    };

    syncFromDom();

    return () => {
      cancelled = true;
    };
  }, [isChatPage, pathname, queryKey]);

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
    [pathname]
  );

  if (!shouldShow) return null;

  return (
    <>
      <div className='mobile-app-topbar' aria-label='EchoPaws mobile top bar'>
        <Link href='/' className='mobile-app-topbar__brand'>
          <span className='mobile-app-topbar__paw'>🐾</span>
          <span>EchoPaws V2</span>
        </Link>

        {isChatPage && activePet ? (
          <div className='mobile-app-pet-switcher'>
            <button
              type='button'
              className='mobile-app-pet-switcher__trigger'
              aria-expanded={isOpen}
              aria-haspopup='menu'
              aria-label='Switch AI pet'
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <PetThumb name={activePet.name} imageUrl={activePet.imageUrl} size='sm' />
              <span className='mobile-app-pet-switcher__name'>{activePet.name}</span>
              <span className='mobile-app-pet-switcher__chevron'>
                <ChevronDownIcon open={isOpen} />
              </span>
            </button>

            {isOpen ? (
              <>
                <button
                  type='button'
                  aria-label='Close pet switcher'
                  className='mobile-app-pet-switcher__backdrop'
                  onClick={() => setIsOpen(false)}
                />
                <div className='mobile-app-pet-switcher__menu' role='menu'>
                  {chatPetPayload?.pets.map((pet) => {
                    const isActive = pet.id === chatPetPayload.activePetId;

                    return (
                      <Link
                        key={pet.id}
                        href={pet.href}
                        role='menuitem'
                        className={
                          isActive
                            ? 'mobile-app-pet-switcher__item is-active'
                            : 'mobile-app-pet-switcher__item'
                        }
                        onClick={() => {
                          setIsOpen(false);
                        }}
                      >
                        <PetThumb name={pet.name} imageUrl={pet.imageUrl} size='md' />
                        <span className='mobile-app-pet-switcher__item-text'>
                          <span className='mobile-app-pet-switcher__item-name'>{pet.name}</span>
                          <span className='mobile-app-pet-switcher__item-sub'>
                            {isActive ? 'Current AI Pet' : 'Switch to this pet'}
                          </span>
                        </span>
                        {isActive ? (
                          <span className='mobile-app-pet-switcher__check'>✓</span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <nav className='mobile-app-bottomnav' aria-label='EchoPaws mobile navigation'>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={item.active ? 'mobile-app-bottomnav__item is-active' : 'mobile-app-bottomnav__item'}
          >
            <span className='mobile-app-bottomnav__icon'>{item.icon}</span>
            <span className='mobile-app-bottomnav__label'>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
