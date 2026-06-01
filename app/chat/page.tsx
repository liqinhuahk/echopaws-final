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
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
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

      <div className='hidden md:block'>
        <SiteHeader />
      </div>

      <div className='chat-page-shell mx-auto max-w-7xl px-4 py-3 md:py-6'>
        <section className='mb-6 hidden rounded-[30px] border border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 p-6 shadow-sm md:block'>
          <div className='flex items-center gap-4'>
            <PetAvatar name={selectedPet.name} imageUrl={selectedPet.image_url} size='lg' />
            <div className='min-w-0'>
              <h1 className='text-3xl font-black text-slate-900'>Chat with {selectedPet.name}</h1>
              <p className='mt-1 text-sm text-slate-600'>
                {usageLabel} ·{' '}
                {selectedPet.id === petOverview.defaultPetId ? 'Primary Pet' : 'Companion'}
              </p>
            </div>

            <div className='ml-auto flex gap-3'>
              <Link
                href={`/memories?pet_id=${selectedPet.id}`}
                className='subtle-button !h-10 text-sm'
              >
                Memories
              </Link>
              <Link href='/pets' className='subtle-button !h-10 text-sm'>
                Manage
              </Link>
            </div>
          </div>
        </section>

        <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
          <aside className='hidden space-y-5 xl:block'>
            <div className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm'>
              <h3 className='text-xs font-bold uppercase tracking-widest text-orange-700'>
                Pet Switcher
              </h3>

              <div className='mt-4 space-y-2'>
                {pets.map((p) => (
                  <Link
                    key={p.id}
                    href={`/chat?pet_id=${p.id}`}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                      p.id === selectedPet.id
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <PetAvatar name={p.name} imageUrl={p.image_url} size='sm' />
                    <span className='font-bold text-slate-800'>{p.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <main className='chat-page-main min-w-0'>
            <section className='chat-page-card rounded-[24px] border border-orange-100 bg-white p-2 shadow-sm md:min-h-[500px] md:p-5'>
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
    </>
  );
}
