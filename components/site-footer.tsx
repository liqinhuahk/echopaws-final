type SiteFooterProps = {
  text?: string;
};

export function SiteFooter({
  text = '© 2026 EchoPaws.ai. All Rights Reserved',
}: SiteFooterProps) {
  return (
    <footer className='site-footer site-footer--compact'>
      <div className='container-shell site-footer__inner'>
        <div>{text}</div>
      </div>
    </footer>
  );
}
