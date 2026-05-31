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

function PetThumb({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <span className='inline-flex h-7 w-7 shrink-0 overflow-hidden rounded-full border border-orange-100 bg-orange-50'>
        <img src={imageUrl} alt={name} className='h-full w-full object-cover' />
      </span>
    );
  }
  return <span className='inline-flex h-7 w-7 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-[13px]'>🐾</span>;
}

export function MobileAppChrome() {
  const pathname = usePathname();
  const shouldShow = isCoreMobileAppRoute(pathname);
  const isChatPage = pathname.startsWith('/chat');
  const [isOpen, setIsOpen] = useState(false);
  const [payload, setPayload] = useState<ChatPetPayload | null>(null);

  useEffect(() => {
    if (shouldShow) document.body.classList.add('mobile-chrome-active');
    else document.body.classList.remove('mobile-chrome-active');
  }, [shouldShow]);

  useEffect(() => {
    const el = document.getElementById('mobile-chat-pets-data');
    if (el?.textContent) {
      try { setPayload(JSON.parse(el.textContent)); } catch (e) {}
    }
    setIsOpen(false);
  }, [pathname]);

  const activePet = useMemo(() => {
    if (!payload?.pets) return null;
    return payload.pets.find(p => p.id === payload.activePetId) || payload.pets[0];
  }, [payload]);

  if (!shouldShow) return null;

  return (
    <>
      <div className='mobile-app-topbar fixed inset-x-0 top-0 z-[100] border-b border-black/5 bg-white/90 backdrop-blur-xl md:hidden'>
        <div className='mx-auto flex h-[60px] items-center justify-between px-4'>
          <Link href='/' className='flex items-center gap-2 font-black text-slate-900'>
            <span>🐾 EchoPaws</span>
          </Link>

          {isChatPage && activePet && (
            <div className='relative'>
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className='flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm'
              >
                <PetThumb name={activePet.name} imageUrl={activePet.imageUrl} />
                <span className='max-w-[70px] truncate'>{activePet.name}</span>
                <span className='text-[10px] opacity-40'>▼</span>
              </button>

              {isOpen && (
                <>
                  <div className='fixed inset-0 z-10' onClick={() => setIsOpen(false)} />
                  <div className='absolute right-0 top-full z-20 mt-2 w-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200'>
                    <div className='px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-orange-600'>Switch Pet</div>
                    {payload?.pets.map(pet => (
                      <Link key={pet.id} href={pet.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${pet.id === payload.activePetId ? 'bg-orange-50 text-orange-900' : 'hover:bg-slate-50 text-slate-700'}`}>
                        <PetThumb name={pet.name} imageUrl={pet.imageUrl} />
                        <span className='truncate text-sm font-bold'>{pet.name}</span>
                        {pet.id === payload.activePetId && <span className='ml-auto h-1.5 w-1.5 rounded-full bg-orange-500' />}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className='fixed inset-x-0 bottom-0 z-[100] border-t border-black/5 bg-white/95 backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)]'>
        <div className='grid h-[64px] grid-cols-4'>
          {[
            { href: '/', label: 'Home', icon: <HomeIcon />, active: pathname === '/' },
            { href: '/chat', label: 'Chat', icon: <ChatIcon />, active: pathname.startsWith('/chat') },
            { href: '/memories', label: 'Memory', icon: <MemoryIcon />, active: pathname.startsWith('/memories') },
            { href: '/account', label: 'Me', icon: <AccountIcon />, active: pathname.startsWith('/account') }
          ].map(item => (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 transition ${item.active ? 'text-orange-600' : 'text-slate-400'}`}>
              {item.icon}
              <span className='text-[10px] font-bold'>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
