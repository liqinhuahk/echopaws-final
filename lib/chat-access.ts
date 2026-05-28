import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { findSubscriptionByUserId } from '@/lib/subscriptions';

export const FREE_TOTAL_CHAT_LIMIT = 20;
const ACTIVE_VIP_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function isVipActive(
  subscription: { plan?: string | null; status?: string | null } | null | undefined,
) {
  return subscription?.plan === 'vip' && ACTIVE_VIP_STATUSES.has(subscription.status ?? '');
}

export async function getTotalUsage(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('usage_logs')
    .select('message_count')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const used = (data || []).reduce(
    (sum, row) => sum + Number(row.message_count ?? 0),
    0,
  );

  return { used };
}

export async function getChatAccessState(userId: string) {
  const [subscription, usage] = await Promise.all([
    findSubscriptionByUserId(userId),
    getTotalUsage(userId),
  ]);

  const vip = isVipActive(subscription);
  const limit = vip ? null : FREE_TOTAL_CHAT_LIMIT;
  const remaining = vip ? null : Math.max(FREE_TOTAL_CHAT_LIMIT - usage.used, 0);

  return {
    subscription,
    vip,
    limit,
    used: usage.used,
    remaining,
  };
}

export async function consumeFreeChatQuota(
  userId: string,
  limit = FREE_TOTAL_CHAT_LIMIT,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('consume_free_chat_quota', {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: Boolean(row?.allowed),
    used: Number(row?.used ?? 0),
    remaining: Number(row?.remaining ?? 0),
    limit: Number(row?.limit_count ?? limit),
  };
}
