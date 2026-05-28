import Link from 'next/link';
import { CreatePetForm } from '@/components/create-pet-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function CreatePetPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const hasError = Boolean(searchParams?.error);
  const isPetLimitError =
    searchParams?.error?.toLowerCase().includes('up to 2 ai pets') ||
    searchParams?.error?.toLowerCase().includes('delete one pet or upgrade to vip');

  return (
    <>
      <SiteHeader ctaLabel='Preview Chat' ctaHref='/chat' />

      <main className='container-shell py-10'>
        <div className='eyebrow'>Create Your Pet</div>

        <h1 className='page-title mt-4'>Give your pet a soul that remembers you</h1>

        <p className='page-subtitle mx-0'>
          Create a companion with its own personality, habits, and memory. On submit,
          the system validates your plan, checks your pet limit, uploads the image,
          generates the pet prompt, writes the profile into the database, and then
          redirects you into chat.
        </p>

        {hasError ? (
          <div className='mt-6 space-y-4'>
            <div className='rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
              {searchParams?.error}
            </div>

            {isPetLimitError ? (
              <div className='rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900'>
                <div className='font-extrabold'>Free tier pet limit reached</div>
                <div className='mt-1'>
                  Your Free account can keep up to <strong>2 AI pets</strong>. To add a
                  new one, you can either delete an existing pet first, or upgrade to
                  VIP to unlock more pet slots and unlimited chat.
                </div>

                <div className='mt-4 flex flex-wrap gap-3'>
                  <Link href='/pets' className='subtle-button'>
                    Manage Existing Pets
                  </Link>
                  <Link href='/pricing' className='brand-button'>
                    Upgrade to VIP
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className='mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900'>
          <div className='font-extrabold uppercase tracking-[0.06em] text-orange-800'>
            Free Tier Rules
          </div>
          <div className='mt-2'>
            Free accounts can create up to <strong>2 AI pets</strong> and use
            <strong> 20 total lifetime chats</strong> shared across the account.
            These chats do <strong>not</strong> reset daily.
          </div>
          <div className='mt-2'>
            If you want more pets, unlimited conversations, and deeper memory, upgrade
            to <strong> VIP</strong>.
          </div>
        </div>

        <section className='grid gap-6 py-8 lg:grid-cols-[380px_1fr]'>
          <div className='glass-card p-6'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>Pet Profile</h2>
              <p className='mt-1 text-sm text-muted'>
                Required fields are validated server-side to keep the pets table clean,
                consistent, and aligned with your account plan.
              </p>
            </div>

            <CreatePetForm />

            <div className='mt-5 rounded-2xl border border-black/5 bg-white px-4 py-3 text-xs leading-6 text-muted'>
              If your Free account already has 2 pets, this form will not create a
              third one. You will be prompted to manage existing pets or upgrade to
              VIP.
            </div>
          </div>

          <div className='glass-card p-6'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                What happens after you submit
              </h2>
              <p className='mt-1 text-sm text-muted'>
                This page mirrors the real submission flow, including the new Free-tier
                pet limit.
              </p>
            </div>

            <div className='mt-5 rounded-[24px] border border-black/5 bg-card-gradient p-6'>
              <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
                Create Pet Flow
              </div>

              <ol className='mt-3 grid gap-3 text-sm leading-8 text-ink'>
                <li>1. Server checks your account plan and current pet count</li>
                <li>2. Free tier can create up to 2 pets; VIP can create more</li>
                <li>3. Server validates name, breed, personality, image format, and size</li>
                <li>4. Image uploads to Supabase Storage bucket pet-images</li>
                <li>5. System prompt is auto-generated and saved into the pets table</li>
                <li>6. On success, you are redirected to /chat with the new pet selected</li>
              </ol>
            </div>

            <div className='mt-5 grid gap-3 md:grid-cols-3'>
              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <strong className='block text-2xl'>2</strong>
                <span className='text-sm text-muted'>Free tier max pets</span>
              </div>

              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <strong className='block text-2xl'>20</strong>
                <span className='text-sm text-muted'>Lifetime free chats</span>
              </div>

              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <strong className='block text-2xl'>5MB</strong>
                <span className='text-sm text-muted'>Max image size</span>
              </div>
            </div>

            <div className='mt-5 grid gap-4 md:grid-cols-2'>
              <div className='rounded-[24px] border border-black/5 bg-white p-5'>
                <div className='feature-icon'>🧠</div>
                <h3 className='text-lg font-bold'>Auto-Generated Personality</h3>
                <p className='mt-2 text-sm leading-8 text-muted'>
                  Based on breed, personality, food, and habits, the system
                  auto-generates a ready-to-use pet prompt for chat and memory
                  continuity.
                </p>
              </div>

              <div className='rounded-[24px] border border-black/5 bg-white p-5'>
                <div className='feature-icon'>☁️</div>
                <h3 className='text-lg font-bold'>Image Stored in DB</h3>
                <p className='mt-2 text-sm leading-8 text-muted'>
                  After upload, the public image URL is saved to pets.image_url and
                  appears automatically across the chat and management pages.
                </p>
              </div>
            </div>

            <div className='mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
              Want more than 2 pets and unlimited conversations?{' '}
              <Link href='/pricing' className='underline decoration-2 underline-offset-2'>
                Upgrade to VIP
              </Link>{' '}
              to unlock the full EchoPaws companion experience.
            </div>
          </div>
        </section>
      </main>

      <SiteFooter rightText='Connected: pets table / Storage upload / Plan gate / Server Action / API / Validation / Success redirect' />
    </>
  );
}
