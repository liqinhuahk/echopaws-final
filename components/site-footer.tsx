type SiteFooterProps = {
  rightText?: string;
};

export function SiteFooter({
  rightText = 'EchoPaws · Gentle AI companionship',
}: SiteFooterProps) {
  return (
    <footer className='border-t border-black/5 bg-white/70'>
      <div className='container-shell flex flex-col gap-3 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between'>
        <div>© 2026 EchoPaws. Built for warm, memory-aware pet companionship.</div>
        <div>{rightText}</div>
      </div>
    </footer>
  );
}
