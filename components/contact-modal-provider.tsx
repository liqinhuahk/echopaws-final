'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

type ContactModalContextValue = {
  openContactModal: () => void;
  closeContactModal: () => void;
};

const ContactModalContext = createContext<ContactModalContextValue | null>(null);

export function useContactModal() {
  const context = useContext(ContactModalContext);

  if (!context) {
    throw new Error('useContactModal must be used within ContactModalProvider');
  }

  return context;
}

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);

  const value = useMemo(
    () => ({
      openContactModal: () => {
        setSuccess('');
        setError('');
        setOpen(true);
      },
      closeContactModal: () => {
        setOpen(false);
      },
    }),
    [],
  );

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setSuccess('');
    setError('');

    try {
      const formData = new FormData(event.currentTarget);

      const payload = {
        name: String(formData.get('name') ?? '').trim(),
        email: String(formData.get('email') ?? '').trim(),
        subject: String(formData.get('subject') ?? '').trim(),
        message: String(formData.get('message') ?? '').trim(),
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send message.');
      }

      formRef.current?.reset();
      setSuccess('Message sent successfully.');
      setTimeout(() => {
        setOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <ContactModalContext.Provider value={value}>
      {children}

      {open ? (
        <div
          className='fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4'
          onClick={() => setOpen(false)}
          aria-hidden='true'
        >
          <div
            className='w-full max-w-lg rounded-[28px] border border-white/10 bg-[#121212] p-6 text-white shadow-2xl'
            onClick={(event) => event.stopPropagation()}
            role='dialog'
            aria-modal='true'
            aria-labelledby='contact-modal-title'
          >
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2
                  id='contact-modal-title'
                  className='text-2xl font-black tracking-[-0.03em]'
                >
                  Contact us
                </h2>
                <p className='mt-2 text-sm leading-6 text-white/70'>
                  Leave your message here and we’ll send it to support by email.
                </p>
              </div>

              <button
                type='button'
                onClick={() => setOpen(false)}
                className='rounded-full px-3 py-1 text-white/70 transition hover:bg-white/10 hover:text-white'
                aria-label='Close contact modal'
              >
                ✕
              </button>
            </div>

            <form ref={formRef} className='mt-5 grid gap-4' onSubmit={handleSubmit}>
              <label className='grid gap-2 text-sm font-semibold text-white/85'>
                Name
                <input
                  name='name'
                  type='text'
                  placeholder='Your name'
                  className='w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-orange-400'
                  required
                />
              </label>

              <label className='grid gap-2 text-sm font-semibold text-white/85'>
                Email
                <input
                  name='email'
                  type='email'
                  placeholder='your@email.com'
                  className='w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-orange-400'
                  required
                />
              </label>

              <label className='grid gap-2 text-sm font-semibold text-white/85'>
                Subject
                <input
                  name='subject'
                  type='text'
                  placeholder='Subject'
                  className='w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-orange-400'
                />
              </label>

              <label className='grid gap-2 text-sm font-semibold text-white/85'>
                Message
                <textarea
                  name='message'
                  placeholder='Write your message here'
                  rows={5}
                  className='w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-orange-400'
                  required
                />
              </label>

              {success ? (
                <div className='rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300'>
                  {success}
                </div>
              ) : null}

              {error ? (
                <div className='rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 whitespace-pre-wrap break-words'>
                  {error}
                </div>
              ) : null}

              <button
                type='submit'
                disabled={sending}
                className='rounded-2xl bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </ContactModalContext.Provider>
  );
}
