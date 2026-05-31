// app/layout.tsx
import { FixedBottomNav } from '@/components/FixedBottomNav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#FFFBF5]"> {/* 这里建议全局背景色改为奶油白 */}
        {/* 原有的 Header */}
        <div className="pb-16 lg:pb-0"> {/* 给移动端底部导航留出空间 */}
          {children}
        </div>
        
        {/* 插入新组件 */}
        <FixedBottomNav />
      </body>
    </html>
  );
}
