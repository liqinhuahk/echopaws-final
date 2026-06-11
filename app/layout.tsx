import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Manrope } from 'next/font/google';

const fontSans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontDisplay = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'EchoPaws | AI Companion',
    template: '%s | EchoPaws',
  },
  description:
    'A warm, elegant AI companion experience designed for emotionally present pet conversations.',
  applicationName: 'EchoPaws',
  metadataBase: new URL('https://beta.echopaws.ai'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0706',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} min-h-screen overflow-x-hidden bg-[#0b0706] text-[#f8efe8] antialiased selection:bg-[rgba(255,180,103,0.28)] selection:text-[#fff8f2]`}
      >
        <div className="relative min-h-screen overflow-x-hidden bg-[#0b0706] text-[#f8efe8]">
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_18%,rgba(255,148,67,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(255,175,96,0.10),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(255,120,64,0.08),transparent_32%)]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:44px_44px]"
          />

          <div className="relative z-10 min-h-screen">
            {/*
              If your project already has Providers / Toaster / Analytics / Session wrappers,
              place them around {children} here and keep the rest of this layout unchanged.
            */}
            {children}
          </div>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                color-scheme: dark;
                --app-bg: #0b0706;
                --app-text: #f8efe8;
                --app-muted: rgba(255, 239, 231, 0.72);
                --app-line: rgba(255, 233, 220, 0.12);
                --app-line-soft: rgba(255, 233, 220, 0.08);
                --app-warm: #ff9430;
                --app-warm-soft: #ffbe72;
                --app-card-top: rgba(27, 14, 11, 0.82);
                --app-card-bottom: rgba(12, 7, 6, 0.92);
                --header-height: 80px;
                --page-x: clamp(16px, 2vw, 40px);
                --page-max: 1280px;
              }

              html {
                scroll-behavior: smooth;
                background: var(--app-bg);
              }

              body {
                margin: 0;
                font-family: var(--font-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: var(--app-bg);
                color: var(--app-text);
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
              }

              * {
                box-sizing: border-box;
              }

              img,
              svg,
              video,
              canvas {
                display: block;
                max-width: 100%;
              }

              input,
              textarea,
              button,
              select {
                font: inherit;
              }

              a {
                color: inherit;
                text-decoration: none;
              }

              h1,
              h2,
              h3,
              h4,
              h5,
              h6,
              .font-display {
                font-family: var(--font-display), Georgia, Cambria, "Times New Roman", serif;
                letter-spacing: -0.03em;
              }

              /* Global responsive shell helpers */
              .page-shell {
                width: min(100%, var(--page-max));
                margin-inline: auto;
                padding-inline: var(--page-x);
              }

              .page-header-offset {
                padding-top: clamp(96px, 11vw, 132px);
              }

              .page-section-gap {
                padding-bottom: clamp(48px, 8vw, 96px);
              }

              .glass-panel {
                border: 1px solid var(--app-line);
                background:
                  linear-gradient(
                    180deg,
                    var(--app-card-top),
                    var(--app-card-bottom)
                  );
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                box-shadow: 0 30px 100px rgba(0, 0, 0, 0.35);
              }

              .soft-panel {
                border: 1px solid var(--app-line-soft);
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
              }

              .warm-button {
                background: linear-gradient(180deg, var(--app-warm-soft), var(--app-warm));
                color: #2f160c;
                box-shadow: 0 16px 30px rgba(255, 145, 51, 0.26);
                transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
              }

              .warm-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 36px rgba(255, 145, 51, 0.32);
              }

              .thin-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 191, 120, 0.35) rgba(255, 255, 255, 0.03);
              }

              .thin-scrollbar::-webkit-scrollbar {
                width: 10px;
                height: 10px;
              }

              .thin-scrollbar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 999px;
              }

              .thin-scrollbar::-webkit-scrollbar-thumb {
                background: linear-gradient(
                  180deg,
                  rgba(255, 190, 114, 0.55),
                  rgba(255, 148, 48, 0.45)
                );
                border-radius: 999px;
                border: 2px solid transparent;
                background-clip: padding-box;
              }

              .thin-scrollbar::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(
                  180deg,
                  rgba(255, 190, 114, 0.72),
                  rgba(255, 148, 48, 0.62)
                );
                border-radius: 999px;
                border: 2px solid transparent;
                background-clip: padding-box;
              }

              /* Prevent random horizontal overflow from long content / panels */
              .content-safe {
                min-width: 0;
              }

              /* Better mobile text scaling */
              @media (max-width: 640px) {
                html {
                  -webkit-text-size-adjust: 100%;
                }

                :root {
                  --page-x: 16px;
                }
              }

              /* Safer height behavior on mobile browsers */
              @supports (height: 100dvh) {
                .min-screen-dvh {
                  min-height: 100dvh;
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
