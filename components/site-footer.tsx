import Link from 'next/link';

type SiteFooterProps = {
  text?: string;
  theme?: 'light' | 'dark';
};

export function SiteFooter({
  text = '© 2026 EchoPaws.ai. All Rights Reserved.',
  theme = 'dark',
}: SiteFooterProps) {
  const isDark = theme === 'dark';

  const borderClassName = isDark ? 'border-white/10' : 'border-black/10';
  const textClassName = isDark ? 'text-stone-400' : 'text-stone-500';

  const brandTextClassName = isDark
    ? 'bg-gradient-to-r from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-lg font-black tracking-[-0.03em] text-transparent md:text-xl'
    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 bg-clip-text text-lg font-black tracking-[-0.03em] text-transparent md:text-xl';

  const pawWrapClassName = isDark
    ? 'grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[1.08rem] shadow-[0_10px_24px_rgba(249,115,22,0.35)] md:h-12 md:w-12 md:text-[1.16rem]'
    : 'grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-[1.08rem] shadow-[0_8px_18px_rgba(249,115,22,0.22)] md:h-12 md:w-12 md:text-[1.16rem]';

  return (
    <footer className={`mt-16 border-t bg-transparent ${borderClassName}`}>
      <div className='container-shell py-8 md:py-10'>
        <div className='flex flex-col items-center justify-between gap-5 md:flex-row'>
          <Link href='/' className='flex items-center gap-3'>
            <span className={pawWrapClassName} aria-hidden='true'>
              🐾
            </span>
            <span className={brandTextClassName}>EchoPaws</span>
          </Link>

          <p className={`text-sm font-medium tracking-[0.01em] ${textClassName}`}>
            {text}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
