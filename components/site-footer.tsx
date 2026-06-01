type SiteFooterProps = {
  text?: string;
};

export function SiteFooter({
  text = '© 2026 EchoPaws.ai. All Rights Reserved.',
}: SiteFooterProps) {
  return (
    <footer className='mt-16 border-t border-black/10 bg-transparent'>
      <div className='container-shell py-8 md:py-10'>
        <p className='text-sm font-medium tracking-[0.01em] text-stone-500'>{text}</p>
      </div>
    </footer>
  );
}
