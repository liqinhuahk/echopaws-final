import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChatPlayground } from '@/components/chat-playground';
import { SiteHeader } from '@/components/site-header';
import { getChatAccessStatus } from '@/lib/chat-access';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function PetAvatar({
  name,
  imageUrl,
  size = 'md',
}: {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClass =
    size === 'sm'
      ? 'h-10 w-10 rounded-xl'
      : size === 'lg'
        ? 'h-20 w-20 rounded-[22px]'
        : size === 'xl'
          ? 'h-16 w-16 rounded-[20px]'
          : 'h-14 w-14 rounded-[18px]';

  return imageUrl ? (
    <div
      className={`shrink-0 overflow-hidden border border-white/10 bg-white/5 shadow-[0_8px_22px_rgba(0,0,0,0.22)] ${sizeClass}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={name} className='h-full w-full object-cover' />
    </div>
  ) : (
    <div
      className={`flex shrink-0 items-center justify-center border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-[var(--noir-text-soft,#f2dbc0)] shadow-[0_8px_22px_rgba(0,0,0,0.22)] ${sizeClass}`}
    >
      🐾
    </div>
  );
}

const liveBadgeClassName =
  'inline-flex items-center justify-center rounded-full border border-[#e5a962]/25 bg-[rgba(229,169,98,0.12)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f6d19b] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

export default async function ChatPage({
  searchParams,
}: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const resolvedParams = searchParams ? await Promise.resolve(searchParams) : {};
  const requestedPetId = pickFirst(resolvedParams?.pet_id || resolvedParams?.petId).trim();

  if (!hasSupabaseEnv()) redirect('/login');

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [petOverview, usageResult] = await Promise.all([
    getPetsForUser(user.id).catch(() => ({ pets: [], defaultPetId: null })),
    getChatAccessStatus(user.id).catch(() => null),
  ]);

  const pets = petOverview?.pets ?? [];
  if (!pets.length) redirect('/create-pet');

  const selectedPet =
    pets.find((p) => p.id === requestedPetId) ||
    pets.find((p) => p.id === petOverview.defaultPetId) ||
    pets[0];

  const { data: messagesData } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('pet_id', selectedPet.id)
    .order('created_at', { ascending: true })
    .limit(100);

  const initialMessages = messagesData?.length
    ? messagesData.map((m) => ({ role: m.role, content: m.content }))
    : [{ role: 'assistant', content: `Hi, I'm ${selectedPet.name}. I'm so happy to see you!` }];

  const usageLabel = usageResult?.vip
    ? 'VIP — Unlimited'
    : `${usageResult?.remaining ?? 0} / 20 chats left`;

  return (
    <>
      <script
        id='mobile-chat-pets-data'
        type='application/json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            activePetId: selectedPet.id,
            pets: pets.map((p) => ({
              id: p.id,
              name: p.name,
              imageUrl: p.image_url,
              href: `/chat?pet_id=${p.id}`,
            })),
          }),
        }}
      />

      <div className='app-brand-backdrop page-noir min-h-screen'>
        <div className='hidden md:block'>
          <SiteHeader theme='dark' />
        </div>

        <div className='chat-page-shell mx-auto max-w-7xl px-4 py-4 md:py-8'>
          <section className='noir-hero mb-6 rounded-[34px] p-5 md:p-7'>
            <div className='noir-pill px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em]'>
              🐾 Warm Companion Chat
            </div>

            <div className='mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
              <div className='flex items-start gap-4 sm:items-center'>
                <PetAvatar name={selectedPet.name} imageUrl={selectedPet.image_url} size='lg' />

                <div className='min-w-0'>
                  <h1 className='text-[clamp(2rem,3vw,2.8rem)] font-black tracking-[-0.04em] text-white'>
                    Chat with {selectedPet.name}
                  </h1>

                  <p className='mt-2 max-w-3xl text-sm leading-7 text-[var(--noir-text-soft,#d7c0a7)]'>
                    A warmer, calmer chat space designed to keep your companion emotionally front
                    and center — soft contrast, cozy bubbles, and a gentler place to keep talking.
                  </p>

                  <div className='mt-3 flex flex-wrap items-center gap-3'>
                    <span className='noir-chip-active px-3 py-1.5 text-xs font-bold'>
                      {usageLabel}
                    </span>
                    <span className='noir-chip px-3 py-1.5 text-xs font-semibold'>
                      {selectedPet.id === petOverview.defaultPetId ? 'Primary Pet' : 'Companion'}
                    </span>
                    <span className={liveBadgeClassName}>Live</span>
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap gap-3'>
                <Link
                  href={`/memories?pet_id=${selectedPet.id}`}
                  className='subtle-button !h-11 text-sm'
                >
                  Memories
                </Link>

                <Link href='/pets' className='subtle-button !h-11 text-sm'>
                  Manage
                </Link>
              </div>
            </div>
          </section>

          <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
            <aside className='hidden space-y-5 xl:block'>
              <section className='noir-panel rounded-[30px] p-5'>
                <div className='text-xs font-bold uppercase tracking-[0.18em] text-[var(--noir-text-muted,#9f8c7d)]'>
                  Pet Switcher
                </div>
                <h3 className='mt-1 text-lg font-black text-white'>Choose your companion</h3>

                <div className='mt-4 space-y-3'>
                  {pets.map((p) => (
                    <Link
                      key={p.id}
                      href={`/chat?pet_id=${p.id}`}
                      className={`group flex items-center gap-3 rounded-[22px] border p-3.5 transition ${
                        p.id === selectedPet.id
                          ? 'border-white/20 bg-[rgba(255,255,255,0.08)] shadow-[0_12px_24px_rgba(0,0,0,0.24)]'
                          : 'border-white/10 bg-white/5 hover:border-[#e5a962]/25 hover:bg-white/8 hover:shadow-[0_10px_22px_rgba(0,0,0,0.18)]'
                      }`}
                    >
                      <PetAvatar name={p.name} imageUrl={p.image_url} size='sm' />

                      <div className='min-w-0 flex-1'>
                        <div
                          className={`truncate font-bold ${
                            p.id === selectedPet.id
                              ? 'text-white'
                              : 'text-[var(--noir-text-soft,#ead6bf)] group-hover:text-white'
                          }`}
                        >
                          {p.name}
                        </div>

                        <div
                          className={`text-xs ${
                            p.id === selectedPet.id
                              ? 'text-[#e5c49a]'
                              : 'text-[var(--noir-text-muted,#9f8c7d)]'
                          }`}
                        >
                          {p.id === petOverview.defaultPetId ? 'Primary pet' : 'Companion'}
                        </div>
                      </div>

                      <div className='flex flex-col items-end gap-1'>
                        {p.id === petOverview.defaultPetId ? (
                          <span className='inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--noir-text-soft,#ead3b5)]'>
                            Primary
                          </span>
                        ) : null}

                        {p.id === selectedPet.id ? (
                          <span className={liveBadgeClassName}>Live</span>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className='noir-panel noir-panel-glow rounded-[30px] p-5'>
                <div className='text-xs font-bold uppercase tracking-[0.18em] text-[var(--noir-text-muted,#9f8c7d)]'>
                  Companion Mood
                </div>

                <h3 className='mt-2 text-lg font-black text-white'>A softer place to chat</h3>

                <p className='mt-3 text-sm leading-7 text-[var(--noir-text-soft,#d7c0a7)]'>
                  Warm glow, quieter framing, and clearer message focus make the conversation feel
                  more personal, calm, and emotionally close.
                </p>

                <div className='mt-4 rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 text-sm text-[var(--noir-text-soft,#ead6bf)] shadow-sm'>
                  Best for reunion-style chats, memory prompts, and cozy daily check-ins with your
                  pet.
                </div>
              </section>
            </aside>

            <main className='chat-page-main min-w-0'>
              <section className='chat-page-card noir-panel rounded-[30px] p-2 md:min-h-[500px] md:p-5'>
                <div className='chat-noir-frame rounded-[26px] p-2 md:p-3'>
                  <ChatPlayground
                    key={selectedPet.id}
                    petId={selectedPet.id}
                    petName={selectedPet.name}
                    petImageUrl={selectedPet.image_url}
                    initialMessages={initialMessages}
                    initialRemainingLabel={usageLabel}
                  />
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
