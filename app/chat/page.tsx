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
      className={`shrink-0 overflow-hidden border border-orange-100 bg-orange-50 shadow-sm ${sizeClass}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={name} className='h-full w-full object-cover' />
    </div>
  ) : (
    <div
      className={`flex shrink-0 items-center justify-center border border-orange-100 bg-orange-100 text-orange-900 shadow-sm ${sizeClass}`}
    >
      🐾
    </div>
  );
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const resolvedParams = searchParams ? await Promise.resolve(searchParams) : {};
  const requestedPetId = pickFirst(resolvedParams?.pet_id).trim();

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

      <div className='app-brand-backdrop'>
        <div className='hidden md:block'>
          <SiteHeader />
        </div>

        <div className='chat-page-shell mx-auto max-w-7xl px-4 py-4 md:py-8'>
          <section className='mb-6 rounded-[32px] border border-white/55 bg-white/74 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-md md:p-7'>
            <div className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/90 px-4 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-orange-700'>
              🐾 Warm Companion Chat
            </div>

            <div className='mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
              <div className='flex items-start gap-4 sm:items-center'>
                <PetAvatar name={selectedPet.name} imageUrl={selectedPet.image_url} size='lg' />

                <div className='min-w-0'>
                  <h1 className='text-[clamp(2rem,3vw,2.8rem)] font-black tracking-[-0.04em] text-slate-900'>
                    Chat with {selectedPet.name}
                  </h1>
                  <p className='mt-2 max-w-3xl text-sm leading-7 text-slate-600'>
                    Continue the same warm EchoPaws feeling from Home: soft light, cozy mood, and a
                    focused chat space that keeps your companion front and center.
                  </p>
                  <p className='mt-2 text-sm font-semibold text-slate-600'>
                    {usageLabel} ·{' '}
                    {selectedPet.id === petOverview.defaultPetId ? 'Primary Pet' : 'Companion'}
                  </p>
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
              <section className='rounded-[28px] border border-white/55 bg-white/80 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-md'>
                <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                  Pet Switcher
                </div>
                <h3 className='mt-1 text-lg font-black text-slate-900'>Choose your companion</h3>

                <div className='mt-4 space-y-2'>
                  {pets.map((p) => (
                    <Link
                      key={p.id}
                      href={`/chat?pet_id=${p.id}`}
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                        p.id === selectedPet.id
                          ? 'border-orange-200 bg-orange-50/90'
                          : 'border-slate-100 bg-white/80 hover:bg-slate-50'
                      }`}
                    >
                      <PetAvatar name={p.name} imageUrl={p.image_url} size='sm' />
                      <div className='min-w-0 flex-1'>
                        <div className='truncate font-bold text-slate-800'>{p.name}</div>
                        <div className='text-xs text-slate-500'>
                          {p.id === petOverview.defaultPetId ? 'Primary pet' : 'Companion'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className='rounded-[28px] border border-white/55 bg-white/80 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-md'>
                <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
                  Companion Mood
                </div>
                <p className='mt-3 text-sm leading-7 text-slate-600'>
                  A quieter, brighter chat shell helps the pet avatar, name, and conversation stay
                  emotionally central while still matching the home-page warmth.
                </p>
              </section>
            </aside>

            <main className='chat-page-main min-w-0'>
              <section className='chat-page-card rounded-[28px] border border-white/55 bg-white/84 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-md md:min-h-[500px] md:p-5'>
                <ChatPlayground
                  key={selectedPet.id}
                  petId={selectedPet.id}
                  petName={selectedPet.name}
                  petImageUrl={selectedPet.image_url}
                  initialMessages={initialMessages}
                  initialRemainingLabel={usageLabel}
                />
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
