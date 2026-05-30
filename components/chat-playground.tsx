return (
  <div className='flex min-h-[620px] flex-col xl:h-full xl:min-h-0'>
    <div className='flex flex-wrap items-center gap-3'>
      <div className='rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm'>
        {usageLabel}
      </div>

      <a
        href={memoriesHref}
        className='rounded-full border border-[#d8d8d8] bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50'
      >
        Open Pet Memory Page
      </a>
    </div>

    <div className='mt-5 flex min-h-0 flex-1 flex-col rounded-[28px] border border-[#e5e7eb] bg-[#f5f5f7] p-4 shadow-inner'>
      <div
        ref={messageViewportRef}
        className='min-h-0 flex-1 overflow-y-auto pr-1 overscroll-contain scroll-smooth'
      >
        <div className='grid gap-4'>
          {messages.map((message, index) => {
            const messageKey = `${message.role}-${index}-${message.content.slice(0, 24)}`;

            if (message.role === 'assistant') {
              return (
                <div key={messageKey} className='flex items-end gap-3'>
                  <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />

                  <div className='min-w-0 max-w-[82%]'>
                    <div className='mb-1 px-1 text-[11px] font-bold tracking-wide text-slate-500'>
                      {petName}
                    </div>

                    <div className='relative rounded-[18px] rounded-bl-md border border-[#e6e6ea] bg-white px-4 py-3 text-[15px] text-slate-800 shadow-sm'>
                      <span className='absolute -left-[6px] bottom-3 h-3 w-3 rotate-45 border-b border-l border-[#e6e6ea] bg-white' />
                      <div className='relative z-[1]'>{renderAssistantContent(message.content)}</div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={messageKey} className='flex justify-end'>
                <div className='min-w-0 max-w-[72%]'>
                  <div className='mb-1 px-1 text-right text-[11px] font-bold tracking-wide text-slate-500'>
                    You
                  </div>

                  <div className='relative rounded-[18px] rounded-br-md bg-[#95ec69] px-4 py-3 text-[15px] text-slate-900 shadow-sm'>
                    <span className='absolute -right-[6px] bottom-3 h-3 w-3 rotate-45 bg-[#95ec69]' />
                    <div className='relative z-[1] whitespace-pre-wrap break-words leading-7'>
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {loading ? (
            <div className='flex items-end gap-3'>
              <PetReplyAvatar petName={petName} petImageUrl={petImageUrl} />

              <div className='min-w-0 max-w-[82%]'>
                <div className='mb-1 px-1 text-[11px] font-bold tracking-wide text-slate-500'>
                  {petName}
                </div>

                <div className='relative rounded-[18px] rounded-bl-md border border-[#e6e6ea] bg-white px-4 py-3 shadow-sm'>
                  <span className='absolute -left-[6px] bottom-3 h-3 w-3 rotate-45 border-b border-l border-[#e6e6ea] bg-white' />
                  <div className='relative z-[1] flex items-center gap-2 text-slate-500'>
                    <span className='h-2 w-2 animate-pulse rounded-full bg-slate-300' />
                    <span className='h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:120ms]' />
                    <span className='h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:240ms]' />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>

    {error ? (
      <div className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800'>
        {error}
      </div>
    ) : null}

    {memoryHints.length ? (
      <div className='mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-3'>
        <div className='text-xs font-bold uppercase tracking-[0.18em] text-emerald-700'>
          New Memory Triggers
        </div>
        <div className='mt-3 flex flex-wrap gap-2'>
          {memoryHints.map((hint, index) => (
            <span
              key={`${hint}-${index}`}
              className='rounded-full bg-white px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm shadow-emerald-100'
            >
              Remembered: {hint}
            </span>
          ))}
        </div>
      </div>
    ) : null}

    <form className='mt-5 shrink-0' onSubmit={handleSubmit}>
      <div className='rounded-[26px] border border-[#e5e7eb] bg-white p-3 shadow-sm'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <div className='min-w-0 flex-1'>
            <input
              className='w-full rounded-full border border-[#d9d9de] bg-[#fafafa] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b7b7bd] focus:bg-white'
              type='text'
              placeholder='Type a message, e.g. I am feeling a little tired today'
              value={input}
              maxLength={800}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>

          <button
            type='submit'
            className='inline-flex items-center justify-center rounded-full bg-[#95ec69] px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={!canSubmit}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className='mt-3 flex flex-col gap-2 px-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between'>
          <span>{usageDetail || 'Free chats are shared across your account.'}</span>
          <span>{input.length} / 800</span>
        </div>
      </div>
    </form>
  </div>
);
