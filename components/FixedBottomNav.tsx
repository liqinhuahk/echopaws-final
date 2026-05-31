'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function FixedBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/pets', icon: '🏠' }, // 这里的 /pets 对应你的 Manage 页面
    { label: 'Chat', href: '/chat', icon: '💬' },
    { label: 'Memory', href: '/memories', icon: '🧠' },
    { label: 'Create', href: '/create-pet', icon: '✨' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-slate-200 bg-white/80 backdrop-blur-lg lg:hidden">
      <div className="flex h-16 items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/pets' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-orange-600' : 'text-slate-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
