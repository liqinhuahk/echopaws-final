import './globals.css';
import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EchoPaws',
  description: 'Your pet. Forever by your side.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${manrope.className} bg-[#0b0706] text-[#f7efe8] antialiased selection:bg-[#ff9f43]/35 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
