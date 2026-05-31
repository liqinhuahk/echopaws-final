import type { Metadata } from 'next';
import { SupabaseProvider } from '@/components/supabase-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'EchoPaws — Your Pet, Always By Your Side',
  description:
    'Create an AI companion from your pet. It remembers you, understands you, and grows closer with every conversation.',
};

const inlineSmokeTestCss = `
  :root {
    color-scheme: light;
    --bg: #fffaf3;
    --bg-soft: #faf7f2;
    --card: rgba(255,255,255,.88);
    --text: #1f2937;
    --muted: #6b7280;
    --line: rgba(15,23,42,.08);
    --amber: #f59e0b;
    --orange: #f97316;
    --shadow-soft: 0 20px 60px rgba(31,41,55,.10);
    --radius-xl: 28px;
  }

  html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }

  body {
    margin: 0;
    min-height: 100vh;
    min-height: 100dvh;
    color: var(--text);
    background:
      radial-gradient(circle at 10% 10%, rgba(245,158,11,.10), transparent 30%),
      radial-gradient(circle at 90% 0, rgba(249,115,22,.08), transparent 28%),
      linear-gradient(180deg,#fffaf3 0%,#faf7f2 40%,#f8f4ee 100%);
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  img, svg, video, canvas {
    display: block;
    max-width: 100%;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button, input, select, textarea {
    font: inherit;
  }

  header {
    position: sticky;
    top: 0;
    z-index: 30;
    backdrop-filter: blur(14px);
    background: rgba(255,250,243,.72);
    border-bottom: 1px solid var(--line);
  }

  main {
    width: 100%;
  }

  .app-shell {
    min-height: 100vh;
    min-height: 100dvh;
  }

  .container-shell {
    width: min(calc(100% - 32px), 1180px);
    margin-left: auto;
    margin-right: auto;
  }

  .glass-card,
  .feature-card {
    border: 1px solid var(--line);
    background: var(--card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-soft);
    backdrop-filter: blur(18px);
  }

  .feature-card {
    padding: 24px;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(15,23,42,.05);
    background: rgba(255,255,255,.8);
    color: #92400e;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .08em;
  }

  .page-title {
    margin: 16px 0 0;
    font-size: clamp(2.25rem, 6vw, 4.5rem);
    line-height: .98;
    letter-spacing: -.05em;
    font-weight: 800;
  }

  .page-subtitle {
    margin-top: 18px;
    max-width: 760px;
    color: var(--muted);
    font-size: 18px;
    line-height: 1.95;
  }

  .section-title {
    margin: 0;
    font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 1.02;
    letter-spacing: -.04em;
    font-weight: 800;
  }

  .section-subtitle {
    margin: 12px auto 0;
    max-width: 760px;
    color: var(--muted);
    font-size: 18px;
    line-height: 1.95;
  }

  .brand-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 50px;
    padding: 0 24px;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--amber), var(--orange));
    color: #fff;
    font-weight: 800;
    box-shadow: 0 12px 30px rgba(249,115,22,.24);
    transition: transform .18s ease, filter .18s ease;
  }

  .brand-button:hover {
    transform: translateY(-1px);
    filter: brightness(1.02);
  }

  .subtle-button,
  .plain-link-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 50px;
    padding: 0 24px;
    border-radius: 999px;
    border: 1px solid rgba(15,23,42,.1);
    background: rgba(255,255,255,.86);
    color: var(--text);
    font-weight: 800;
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    margin-bottom: 16px;
    border-radius: 18px;
    background: linear-gradient(135deg,#fef3c7,#fed7aa);
    font-size: 24px;
  }

  .chat-bubble-user {
    margin-left: auto;
    max-width: 82%;
    border-radius: 18px;
    border: 1px solid rgba(15,23,42,.05);
    background: #fff;
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.9;
    box-shadow: 0 8px 20px rgba(148,163,184,.12);
  }

  .chat-bubble-ai {
    max-width: 82%;
    border-radius: 18px;
    border: 1px solid rgba(251,191,36,.35);
    background: linear-gradient(180deg,#fff0df 0%,#ffe7cc 100%);
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.9;
    box-shadow: 0 8px 20px rgba(251,146,60,.12);
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(15,23,42,.05);
    background: #fff;
    color: #92400e;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 800;
  }

  .input-shell {
    width: 100%;
    min-height: 48px;
    border-radius: 18px;
    border: 1px solid rgba(15,23,42,.1);
    background: rgba(255,255,255,.92);
    padding: 12px 16px;
    font-size: 16px;
    color: var(--text);
    outline: none;
  }

  .input-shell:focus {
    border-color: rgba(249,115,22,.42);
    box-shadow: 0 0 0 4px rgba(251,146,60,.12);
  }

  .grid { display: grid; }
  .flex { display: flex; }
  .inline-flex { display: inline-flex; }
  .flex-wrap { flex-wrap: wrap; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: .5rem; }
  .gap-3 { gap: .75rem; }
  .gap-4 { gap: 1rem; }
  .gap-6 { gap: 1.5rem; }
  .gap-8 { gap: 2rem; }
  .gap-10 { gap: 2.5rem; }
  .pt-12 { padding-top: 3rem; }
  .pb-8 { padding-bottom: 2rem; }
  .mt-4 { margin-top: 1rem; }
  .mt-7 { margin-top: 1.75rem; }
  .mt-8 { margin-top: 2rem; }
  .mx-0 { margin-left: 0; margin-right: 0; }
  .text-sm { font-size: .875rem; }
  .text-muted { color: var(--muted); }

  .container-shell.grid {
    display: grid;
    gap: 2.5rem;
    padding-top: 3rem;
    padding-bottom: 2rem;
  }

  @media (min-width: 768px) {
    .container-shell.grid {
      grid-template-columns: 1.08fr .92fr;
      align-items: center;
    }
  }

  @media (max-width: 1024px) {
    .container-shell,
    main > section,
    footer {
      width: min(calc(100% - 20px), 100%);
    }

    .page-title {
      font-size: clamp(1.9rem, 8vw, 2.6rem);
      line-height: 1.03;
    }

    .page-subtitle,
    .section-subtitle {
      font-size: 15px;
      line-height: 1.85;
    }

    .section-title {
      font-size: clamp(1.55rem, 7vw, 2rem);
    }
  }

  @media (max-width: 640px) {
    .container-shell,
    main > section,
    footer {
      width: min(calc(100% - 16px), 100%);
    }

    .page-title {
      font-size: 1.75rem;
    }
  }
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body>
        <style dangerouslySetInnerHTML={{ __html: inlineSmokeTestCss }} />
        <SupabaseProvider>
          <div className='app-shell'>{children}</div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
