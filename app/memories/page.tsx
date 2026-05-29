<div className='mt-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1 xl:overscroll-contain'>
  {!allMemories.length ? (
    <div className='rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center'>
      <div className='text-lg font-black text-slate-900'>
        No memories yet for {selectedPet.name}
      </div>
      <p className='mt-2 text-sm leading-7 text-slate-600'>
        Start chatting with {selectedPet.name} and memory entries will appear here as the
        companionship history grows.
      </p>

      <div className='mt-5 flex flex-wrap justify-center gap-3'>
        <Link
          href={`/chat?pet_id=${encodeURIComponent(selectedPet.id)}`}
          className='brand-button'
        >
          Go to Chat
        </Link>
        <Link
          href='/pets'
          className='rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50'
        >
          Manage Pets
        </Link>
      </div>
    </div>
  ) : !filteredMemories.length ? (
    <div className='rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center'>
      <div className='text-lg font-black text-slate-900'>No memories match this view</div>
      <p className='mt-2 text-sm leading-7 text-slate-600'>
        Try a broader search, change the type or priority filter, or reset the view.
      </p>
    </div>
  ) : (
    <div className='space-y-3'>
      {filteredMemories.map((memory) => {
        const expandedByDefault = openAll;

        return (
          <details
            key={memory.id}
            open={expandedByDefault}
            className='group rounded-[24px] border border-slate-200 bg-white transition open:border-orange-200 open:shadow-sm'
          >
            <summary className='list-none cursor-pointer px-4 py-4 sm:px-5'>
              <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-800'>
                      {buildTypeLabel(memory.type)}
                    </span>

                    <span
                      className={[
                        'rounded-full border px-2.5 py-1 text-[11px] font-bold',
                        buildPriorityTone(memory.importance),
                      ].join(' ')}
                    >
                      {buildPriorityLabel(memory.importance)}
                    </span>

                    {selectedPet.id === defaultPetId ? (
                      <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700'>
                        Primary pet
                      </span>
                    ) : null}
                  </div>

                  <div className='mt-3 text-sm font-semibold leading-7 text-slate-900'>
                    {buildExcerpt(memory.content)}
                  </div>

                  <div className='mt-3 text-xs text-slate-500'>
                    Updated {formatDateLabel(memory.updated_at)}
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <span className='rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700'>
                    Click to expand
                  </span>
                </div>
              </div>
            </summary>

            <div className='border-t border-slate-200 px-4 py-4 sm:px-5'>
              <div className='whitespace-pre-wrap break-words text-sm leading-7 text-slate-700'>
                {memory.content}
              </div>

              <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-wrap gap-2 text-xs text-slate-500'>
                  <span>Created {formatDateLabel(memory.created_at)}</span>
                  <span>•</span>
                  <span>Updated {formatDateLabel(memory.updated_at)}</span>
                </div>

                <form action={deleteMemoryAction}>
                  <input type='hidden' name='memoryId' value={memory.id} />
                  <input type='hidden' name='returnTo' value={returnTo} />
                  <button
                    type='submit'
                    className='rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50'
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  )}
</div>
