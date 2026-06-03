'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

type BrowserSupabaseClient = ReturnType<typeof createBrowserSupabaseClient>;

type SupabaseContextType = {
  session: Session | null;
  user: User | null;
  supabase: BrowserSupabaseClient | null;
  isReady: boolean;
  isAvailable: boolean;
  error: string | null;
};

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export function useSupabase() {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }

  return context;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Failed to initialize Supabase client.';
}

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  const { supabase, initError } = useMemo(() => {
    try {
      return {
        supabase: createBrowserSupabaseClient(),
        initError: null as string | null,
      };
    } catch (error) {
      const message = getErrorMessage(error);

      if (process.env.NODE_ENV !== 'production') {
        console.error('[SupabaseProvider] initialization failed:', error);
      } else {
        console.error('[SupabaseProvider] initialization failed:', message);
      }

      return {
        supabase: null,
        initError: message,
      };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setIsReady(true);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        if (!mounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      })
      .catch((error) => {
        console.error('[SupabaseProvider] getSession failed:', error);
      })
      .finally(() => {
        if (mounted) {
          setIsReady(true);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider
      value={{
        session,
        user,
        supabase,
        isReady,
        isAvailable: Boolean(supabase),
        error: initError,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}
