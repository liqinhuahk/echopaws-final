import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SupabaseProvider } from '@/components/supabase-provider';
import { MobileAppChrome } from '@/components/mobile-app-chrome';
import './globals.css';

export const metadata: Metadata = {
  title: 'EchoPaws — Your Pet, Always By Your Side',
  description:
    'Create an AI companion from your pet. It remembers you, understands you, and grows closer with every conversation.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body>
        <SupabaseProvider>
          <Suspense fallback={null}>
            <MobileAppChrome />
          </Suspense>

          <div className='mobile-app-content'>{children}</div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
