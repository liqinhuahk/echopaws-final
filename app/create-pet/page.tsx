import Link from 'next/link';
import { CreatePetForm } from '@/components/create-pet-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { FREE_TOTAL_CHAT_LIMIT, isVipActive } from '@/lib/chat-access';
import { FREE_TIER_MAX_PETS, getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { findSubscriptionByUserId } from '@/lib/subscriptions';

export default async function CreatePetPage({
  searchParams,
}: {
  searchParams?: { error?: string; message?: string };
}) {
  let petCount = 0;
  let vip = false;
  let freeSlotsLeft = FREE_TIER_MAX_PETS;
  let canCreate = true;
  let showLimitNotice = false;
  let headerCtaLabel = 'Preview Chat';
  let headerCtaHref = '/chat';

  if (hasSupabaseEnv()) {
    try {
      const supabase = createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [petsData, subscription] = await Promise.all([
          getPetsForUser(user.id),
          findSubscriptionByUserId(user.id),
        ]);

        petCount = petsData.pets.length;
        vip = isVipActive(subscription);
        freeSlotsLeft = Math.max(FREE_TIER_MAX_PETS - petCount, 0);
        canCreate = vip || freeSlotsLeft > 0;
        showLimitNotice = !vip && petCount >= FREE_TIER_MAX_PETS;

        if (showLimitNotice) {
          headerCtaLabel = 'Upgrade to VIP';
          headerCtaHref = '/pricing';
        } else if (petCount > 0) {
          headerCtaLabel = 'Manage Pets';
          headerCtaHref = '/pets';
        }
      }
    } catch {
      // Keep graceful fallback UI if data cannot be loaded.
    }
  }

  return (
    <>
      <SiteHeader ctaLabel={headerCtaLabel} ctaHref={headerCtaHref} />

      <main className='container-shell py-10'>
        <div className='eyebrow'>Create Your Pet</div>
        <h1 className='page-title mt-4'>Give your pet a soul that remembers you</h1>
        <p className='page-subtitle mx-0 max-w-4xl'>
          Build a pet profile with a real photo, personality, daily habits, and a
          chat-ready identity. Free includes up to {FREE_TIER_MAX_PETS} pets and{' '}
          {FREE_TOTAL_CHAT_LIMIT} lifetime chats shared across your account.
        </p>

        {searchParams?.message ? (
          <div className='mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
            {searchParams.message}
          </div>
        ) : null}

        {searchParams?.error ? (
          <div className='mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
            {searchParams.error}
          </div>
        ) : null}

        {!vip ? (
          <div className='mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-900'>
            <div className='text-xs font-extrabold uppercase tracking-[0.1em] text-amber-800'>
              Free plan limits
            </div>
            <p className='mt-2 leading-7'>
              Free supports up to <strong>{FREE_TIER_MAX_PETS} pets</strong> and{' '}
              <strong>{FREE_TOTAL_CHAT_LIMIT} lifetime chats</strong>. Chats are
              shared across your account and do not reset daily.
            </p>
            <p className='mt-2 leading-7'>
              {showLimitNotice
                ? `You already have ${petCount} pets on Free. Upgrade to VIP if you want to create more pets.`
                : `You currently have ${petCount} pet${petCount !== 1 ? 's' : ''}. You can still create ${freeSlotsLeft} more on Free.`}
            </p>
          </div>
        ) : (
          <div className='mt-6 rounded-2xl bg-orange-50 px-4 py-4 text-sm text-orange-900'>
            <div className='text-xs font-extrabold uppercase tracking-[0.1em] text-orange-800'>
              VIP active
            </div>
            <p className='mt-2 leading-7'>
              Your account is on VIP. You can create more than {FREE_TIER_MAX_PETS}{' '}
              pets and chat without the Free plan limit.
            </p>
          </div>
        )}

        <section className='grid gap-6 py-8 lg:grid-cols-[380px_1fr]'>
          <div className='glass-card p-6'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>Pet Profile</h2>
              <p className='mt-1 text-sm text-muted'>
                Required fields are validated server-side to keep the pets table
                clean and consistent.
              </p>
            </div>

            {showLimitNotice ? (
              <div className='mt-5 rounded-[24px] border border-orange-200 bg-gradient-to-b from-orange-50 to-amber-50 p-5'>
                <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
                  Free pet limit reached
                </div>
                <h3 className='mt-2 text-xl font-bold tracking-tight'>
                  You have reached the Free pet limit
                </h3>
                <p className='mt-3 text-sm leading-8 text-muted'>
                  Free supports up to {FREE_TIER_MAX_PETS} pets. Upgrade to VIP to
                  create more pets, unlock unlimited chats, and keep building deeper
                  long-term memory.
                </p>

                <div className='mt-5 grid gap-3'>
                  <Link href='/pricing' className='brand-button w-full text-center'>
                    Upgrade to VIP
                  </Link>
                  <Link href='/pets' className='subtle-button w-full text-center'>
                    Manage Existing Pets
                  </Link>
                  <Link href='/chat' className='subtle-button w-full text-center'>
                    Back to Chat
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <CreatePetForm />

                {!vip ? (
                  <div className='mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700'>
                    You can create {freeSlotsLeft} more{' '}
                    {freeSlotsLeft === 1 ? 'pet' : 'pets'} on Free.
                  </div>
                ) : (
                  <div className='mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-900'>
                    VIP active. Your account can create more than {FREE_TIER_MAX_PETS}{' '}
                    pets.
                  </div>
                )}
              </>
            )}
          </div>

          <div className='glass-card p-6'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                What happens after you submit
              </h2>
              <p className='mt-1 text-sm text-muted'>
                This flow matches the current live logic for pet creation.
              </p>
            </div>

            <div className='mt-5 rounded-[24px] border border-black/5 bg-card-gradient p-6'>
              <div className='text-xs font-extrabold uppercase tracking-[0.08em] text-orange-800'>
                Create Pet Flow
              </div>
              <ol className='mt-3 grid gap-3 text-sm leading-8 text-ink'>
                <li>1. Server validates name, breed, personality, image format, and image size</li>
                <li>2. Free accounts are checked against the {FREE_TIER_MAX_PETS}-pet limit</li>
                <li>3. Image uploads to the Supabase Storage bucket: pet-images</li>
                <li>4. A system prompt is generated and written to the pets table</li>
                <li>5. The page redirects to chat with the newly created pet selected</li>
              </ol>
            </div>

            <div className='mt-5 grid gap-3 md:grid-cols-3'>
              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <strong className='block text-2xl'>5MB</strong>
                <span className='text-sm text-muted'>Max image size</span>
              </div>
              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <strong className='block text-2xl'>3</strong>
                <span className='text-sm text-muted'>Formats: JPG / PNG / WebP</span>
              </div>
              <div className='rounded-2xl border border-black/5 bg-white p-4'>
                <strong className='block text-2xl'>{FREE_TIER_MAX_PETS}</strong>
                <span className='text-sm text-muted'>Free max pets</span>
              </div>
            </div>

            <div className='mt-5 grid gap-4 md:grid-cols-2'>
              <div className='rounded-[24px] border border-black/5 bg-white p-5'>
                <div className='feature-icon'>🧠</div>
                <h3 className='text-lg font-bold'>Auto-Generated Personality</h3>
                <p className='mt-2 text-sm leading-8 text-muted'>
                  Based on breed, personality, food, and habits, the system
                  auto-generates a ready-to-use pet prompt for chat.
                </p>
              </div>

              <div className='rounded-[24px] border border-black/5 bg-white p-5'>
                <div className='feature-icon'>☁️</div>
                <h3 className='text-lg font-bold'>Image Stored in Database</h3>
                <p className='mt-2 text-sm leading-8 text-muted'>
                  After upload, the public image URL is saved in pets.image_url and
                  shown directly on the chat and pets pages.
                </p>
              </div>
            </div>

            <div className='mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800'>
              Free includes {FREE_TOTAL_CHAT_LIMIT} lifetime chats. VIP unlocks
              unlimited chats, more pet capacity, and deeper long-term memory.
            </div>
          </div>
        </section>
      </main>

      <SiteFooter rightText='Free Max 2 Pets · 20 Lifetime Chats · Storage Upload · Server Validation · VIP Upgrade Path' />
    </>
  );
}
