import { redirect } from 'next/navigation';
import ChatPageClient from './chat-page-client';
import { createServerSupabaseClient, hasSupabaseEnv } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Please%20configure%20Supabase%20environment%20variables%20first.');
  }

  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?message=Please%20log%20in%20to%20continue.&next=%2Fchat');
  }

  return <ChatPageClient />;
}
