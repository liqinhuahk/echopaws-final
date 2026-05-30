<div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-stretch'>
  <aside className='space-y-5'>
    {/* 你左侧原本内容保持不变 */}
  </aside>

  <main className='min-w-0 space-y-5 xl:flex xl:min-h-[calc(100vh-190px)] xl:flex-col'>
    <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm xl:shrink-0'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <div className='text-xs font-bold uppercase tracking-[0.18em] text-orange-700'>
            Conversation Area
          </div>
          <h2 className='mt-1 text-2xl font-black text-slate-900'>Focused chat layout</h2>
        </div>

        <div className='flex flex-wrap gap-2 text-xs text-slate-600'>
          <span className='rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700'>
            Space prioritized for messages
          </span>
          <span className='rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700'>
            Summary folded by default
          </span>
        </div>
      </div>

      <details className='mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3'>
        <summary className='cursor-pointer list-none select-none'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <div className='text-sm font-bold text-slate-900'>Companionship summary</div>
              <div className='mt-1 text-xs text-slate-500'>
                Expand only when you need the longer context
              </div>
            </div>

            <span className='rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-700'>
              Expand
            </span>
          </div>
        </summary>

        <div className='mt-4 border-t border-slate-200 pt-4 text-sm leading-7 text-slate-700'>
          {summaryText}
        </div>
      </details>
    </section>

    <section className='rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm xl:min-h-0 xl:flex xl:flex-1 xl:flex-col'>
      <ChatPlayground
        key={selectedPet.id}
        petId={selectedPet.id}
        petName={selectedPet.name}
        petImageUrl={selectedPet.image_url}
        initialMessages={initialMessages}
        initialRemainingLabel={usageLabel}
        initialMemorySummary={summaryText}
      />
    </section>
  </main>
</div>
