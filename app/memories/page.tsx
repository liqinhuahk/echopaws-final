import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { SiteHeader } from '@/components/site-header';
import { getPetsForUser } from '@/lib/pets';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;
type MemoriesPageProps = {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
};

type MemoryRow = {
  id: string;
  pet_id: string;
  content: string;
  memory_type?: string | null;
  priority?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SummaryRow = {
  pet_id: string;
  summary?: string | null;
  updated_at?: string | null;
};

function pickFirst(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

function buildTypeLabel(type?: string | null) {
  if (!type) return 'Memory';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  return date.toLocaleString();
}

function buildExcerpt(text: string, max = 110) {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max).trim()}…`;
}

function PetAvatar({
  src,
  name,
  className = 'h-14 w-14',
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} rounded-2xl object-cover ring-1 ring-white/10`}
      />
    );
  }

  return (
    <div
      className={`${className} inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300/20 to-orange-500/20 text-lg font-black text-amber-200 ring-1 ring-white/10`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default async function MemoriesPage({ searchParams }: MemoriesPageProps) {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please%20configure%20Supabase%20environment%20variables%20first.');
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const petIdFromQuery = pickFirst(resolvedSearchParams.petId);
  const query = (pickFirst(resolvedSearchParams.query) ?? '').trim().toLowerCase();
  const type = (pickFirst(resolvedSearchParams.type) ?? '').trim().toLowerCase();
  const sort = (pickFirst(resolvedSearchParams.sort) ?? 'latest').trim().toLowerCase();

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please%20sign%20in%20to%20view%20memories.');
  }

  const petOverview = await getPetsForUser(user.id);
  const pets = petOverview?.pets ?? [];

  if (!pets.length) {
    redirect('/create-pet?message=Create%20your%20first%20pet%20to%20start%20using%20memories.');
  }

  const selectedPet =
    pets.find((pet) => String(pet.id) === String(petIdFromQuery)) ||
    pets.find((pet) => pet.id === petOverview?.defaultPetId) ||
    pets[0];

  const petImage =
    (selectedPet as any)?.image_url ??
    (selectedPet as any)?.imageUrl ??
    (selectedPet as any)?.photo_url ??
    (selectedPet as any)?.photoUrl ??
    null;

  const { data: rawMemories } = await supabase
    .from('pet_memories')
    .select('*')
    .eq('pet_id', selectedPet.id)
    .order('updated_at', { ascending: false });

  const { data: rawSummary } = await supabase
    .from('pet_memory_summaries')
    .select('*')
    .eq('pet_id', selectedPet.id)
    .maybeSingle();

  const summaryRow = (rawSummary as SummaryRow | null) ?? null;
  const allMemories = ((rawMemories as MemoryRow[] | null) ?? []).filter(Boolean);

  const filteredMemories = allMemories
    .filter((item) => {
      const queryMatch = query ? item.content?.toLowerCase().includes(query) : true;
      const typeMatch = type ? (item.memory_type ?? '').toLowerCase() === type : true;
      return queryMatch && typeMatch;
    })
    .sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
      }
      return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
    });

  async function deleteMemoryAction(formData: FormData) {
    'use server';

    if (!hasSupabaseEnv()) return;

    const memoryId = String(formData.get('memoryId') ?? '');
    if (!memoryId) return;

    const serverSupabase = createServerSupabaseClient();
    await serverSupabase.from('pet_memories').delete().eq('id', memoryId);

    revalidatePath('/memories');
  }

  return (
    <div className='app-brand-backdrop'>
      <SiteHeader theme='dark' />

      <main className='container-shell py-6 md:py-8'>
        <section className='glass-card p-5 md:p-6'>
          <div className='eyebrow'>✦ Companion memory space</div>

          <div className='mt-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-start gap-4'>
              <PetAvatar src={petImage} name={selectedPet.name} className='h-16 w-16' />

              <div>
                <h1 className='page-title text-[clamp(2.4rem,4vw,4rem)]'>Memories of {selectedPet.name}</h1>
                <p className='mt-3 max-w-2xl text-[0.98rem] leading-[1.9] text-[rgba(255,244,230,0.78)]'>
                  Searchable memories, cleaner filters, and a softer brand shell so the page feels
                  like a natural continuation of Home, Chat, and Account.
                </p>
              </div>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link href='/chat' className='subtle-button'>
                Back to Chat
              </Link>
              <Link href='/pets' className='subtle-button'>
                Manage Pets
              </Link>
            </div>
          </div>
        </section>

        <section className='mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]'>
          <aside className='grid gap-5'>
            <section className='glass-card p-5'>
              <div className='flex items-start gap-3'>
                <PetAvatar src={petImage} name={selectedPet.name} className='h-14 w-14' />
                <div>
                  <div className='text-lg font-extrabold text-[color:#fff7ed]'>{selectedPet.name}</div>
                  <div className='mt-1 text-sm text-[rgba(255,244,230,0.78)]'>
                    {filteredMemories.length} memories
                  </div>
                  <div className='mt-1 text-xs text-[rgba(255,244,230,0.56)]'>
                    Updated {formatDateLabel(summaryRow?.updated_at)}
                  </div>
                </div>
              </div>
            </section>

            <section className='glass-card p-5'>
              <div className='eyebrow'>Pet switcher</div>
              <h2 className='section-title mt-4 text-xl'>Memory scope</h2>

              <div className='mt-5 grid gap-3'>
                {pets.map((pet) => {
                  const itemImage =
                    (pet as any)?.image_url ??
                    (pet as any)?.imageUrl ??
                    (pet as any)?.photo_url ??
                    (pet as any)?.photoUrl ??
                    null;

                  const active = pet.id === selectedPet.id;

                  return (
                    <Link
                      key={pet.id}
                      href={`/memories?petId=${pet.id}`}
                      className={`rounded-2xl border px-4 py-3 transition ${
                        active
                          ? 'border-amber-300/20 bg-amber-400/8'
                          : 'border-white/8 bg-white/4 hover:bg-white/6'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <PetAvatar src={itemImage} name={pet.name} className='h-11 w-11' />
                        <div className='min-w-0'>
                          <div className='truncate text-sm font-bold text-[color:#fff7ed]'>{pet.name}</div>
                          <div className='text-xs text-[rgba(255,244,230,0.56)]'>
                            {pet.id === petOverview?.defaultPetId ? 'Primary pet' : 'Companion'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className='glass-card p-5'>
              <div className='eyebrow'>Companion snapshot</div>
              <p className='mt-4 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
                {summaryRow?.summary ||
                  `${selectedPet.name} is building an ongoing emotional memory space with you.`}
              </p>
            </section>
          </aside>

          <section className='grid gap-5'>
            <section className='glass-card p-5'>
              <form className='grid gap-3 md:grid-cols-[minmax(0,1.4fr)_180px_180px_auto]'>
                <label className='grid gap-2'>
                  <span className='text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[rgba(255,244,230,0.56)]'>
                    Search
                  </span>
                  <input
                    type='search'
                    name='query'
                    defaultValue={pickFirst(resolvedSearchParams.query) ?? ''}
                    placeholder='Search memory text'
                  />
                </label>

                <label className='grid gap-2'>
                  <span className='text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[rgba(255,244,230,0.56)]'>
                    Type
                  </span>
                  <select name='type' defaultValue={pickFirst(resolvedSearchParams.type) ?? ''}>
                    <option value=''>All types</option>
                    <option value='emotion'>Emotion</option>
                    <option value='preference'>Preference</option>
                    <option value='habit'>Habit</option>
                    <option value='story'>Story</option>
                  </select>
                </label>

                <label className='grid gap-2'>
                  <span className='text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[rgba(255,244,230,0.56)]'>
                    Sort
                  </span>
                  <select name='sort' defaultValue={pickFirst(resolvedSearchParams.sort) ?? 'latest'}>
                    <option value='latest'>Latest</option>
                    <option value='oldest'>Oldest</option>
                  </select>
                </label>

                <input type='hidden' name='petId' value={selectedPet.id} />

                <div className='flex items-end gap-3'>
                  <button type='submit' className='brand-button'>
                    Apply
                  </button>
                  <Link href={`/memories?petId=${selectedPet.id}`} className='subtle-button'>
                    Reset
                  </Link>
                </div>
              </form>

              <div className='mt-4 text-sm text-[rgba(255,244,230,0.78)]'>
                {filteredMemories.length} result{filteredMemories.length === 1 ? '' : 's'}
              </div>
            </section>

            <section className='grid gap-4'>
              {filteredMemories.length ? (
                filteredMemories.map((memory) => (
                  <details key={memory.id} className='glass-card p-5'>
                    <summary className='cursor-pointer list-none'>
                      <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                        <div className='min-w-0'>
                          <div className='flex flex-wrap gap-2'>
                            <span className='tag-chip tag-chip--warm'>
                              {buildTypeLabel(memory.memory_type)}
                            </span>
                            <span className='tag-chip tag-chip--soft'>
                              Priority {memory.priority ?? '—'}
                            </span>
                          </div>

                          <p className='mt-4 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
                            {buildExcerpt(memory.content)}
                          </p>
                        </div>

                        <div className='shrink-0 text-xs text-[rgba(255,244,230,0.56)]'>
                          Updated {formatDateLabel(memory.updated_at)}
                        </div>
                      </div>
                    </summary>

                    <div className='mt-5 border-t border-white/8 pt-5 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
                      {memory.content}
                    </div>

                    <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4'>
                      <div className='text-xs text-[rgba(255,244,230,0.56)]'>
                        Created {formatDateLabel(memory.created_at)}
                      </div>

                      <form action={deleteMemoryAction}>
                        <input type='hidden' name='memoryId' value={memory.id} />
                        <button type='submit' className='subtle-button min-h-[38px] px-4 text-sm'>
                          Delete
                        </button>
                      </form>
                    </div>
                  </details>
                ))
              ) : (
                <div className='glass-card p-6 text-sm leading-7 text-[rgba(255,244,230,0.78)]'>
                  No memories matched your current filters yet.
                </div>
              )}
            </section>
          </section>
        </section>
      </main>
    </div>
  );
}
