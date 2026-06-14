import Link from 'next/link';

type EchoPawsLogoProps = {
  href?: string;
  size?: number;
  textSize?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
};

function PawPrintsIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-full w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g fill="#35363A">
        <ellipse cx="23" cy="18.5" rx="3.8" ry="5.2" transform="rotate(-22 23 18.5)" />
        <ellipse cx="30" cy="15.5" rx="3.7" ry="5.1" transform="rotate(-8 30 15.5)" />
        <ellipse cx="37.5" cy="17.3" rx="3.8" ry="5.1" transform="rotate(11 37.5 17.3)" />
        <ellipse cx="43.5" cy="22.5" rx="3.9" ry="5.3" transform="rotate(24 43.5 22.5)" />

        <path d="M22.5 34.5c0-5.8 5.3-10.2 11.4-10.2 6.7 0 12.5 4.8 12.5 11.1 0 5.1-3.7 8.4-8 8.4-2 0-3.2-.5-4.8-1.2-1.2-.5-2.5-1.1-4.3-1.1-1.8 0-3.1.6-4.3 1.1-1.4.6-2.7 1.2-4.4 1.2-4.2 0-8.1-3.4-8.1-9.3Z" />

        <ellipse cx="18.2" cy="37.5" rx="3.7" ry="5.1" transform="rotate(-28 18.2 37.5)" />
        <ellipse cx="24.9" cy="33.2" rx="3.5" ry="4.8" transform="rotate(-13 24.9 33.2)" />
      </g>
    </svg>
  );
}

function LogoMark({ size = 42 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[14px] shadow-[0_10px_30px_rgba(245,158,11,0.28)]"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD27A] via-[#F6AC3E] to-[#EA8A25]" />
      <div className="absolute inset-[10%]">
        <PawPrintsIcon />
      </div>
    </div>
  );
}

function Wordmark({ textSize = 'md' }: { textSize?: 'sm' | 'md' | 'lg' }) {
  const titleClass =
    textSize === 'sm'
      ? 'text-[20px]'
      : textSize === 'lg'
      ? 'text-[30px]'
      : 'text-[24px]';

  const subtitleClass =
    textSize === 'sm'
      ? 'text-[9px] tracking-[0.28em]'
      : textSize === 'lg'
      ? 'text-[11px] tracking-[0.34em]'
      : 'text-[10px] tracking-[0.32em]';

  return (
    <div className="min-w-0">
      <div className={`truncate font-semibold leading-none text-white ${titleClass}`}>
        EchoPaws
      </div>
      <div className={`mt-1 uppercase text-white/60 ${subtitleClass}`}>
        AI Companion
      </div>
    </div>
  );
}

export default function EchoPawsLogo({
  href = '/',
  size = 42,
  textSize = 'md',
  showText = true,
  className = '',
}: EchoPawsLogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      {showText ? <Wordmark textSize={textSize} /> : null}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}
