import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function HomePage() {
  return (
    <div className='flex min-h-screen flex-col'>
      <SiteHeader />

      <main className='flex-1'>
        <section className='container-shell py-10 md:py-16 lg:py-20'>
          <div className='mx-auto max-w-4xl'>
            <div className='eyebrow'>EchoPaws · Emotional AI Companion</div>

            <h1 className='page-title mt-4 max-w-3xl'>
              Your pet. Forever by your side.
            </h1>

            <p className='page-subtitle mt-4 max-w-3xl'>
              EchoPaws helps pet lovers create a comforting AI companion inspired by their beloved
              pets. Through memories, conversations, and emotional connection, every interaction
              feels warm, personal, and familiar.
            </p>

            <div className='mt-8 flex flex-wrap gap-4'>
              <a href='/create-pet' className='brand-button'>
                Create My Pet
              </a>
              <a href='/chat' className='subtle-button'>
                Try AI Chat
              </a>
            </div>

            <div className='mt-7 flex flex-wrap gap-4 text-sm text-muted'>
              <span>✓ Google &amp; Email Login</span>
              <span>✓ Emotional AI Chat</span>
              <span>✓ Long-Term Memory</span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
