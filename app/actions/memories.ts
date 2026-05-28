'use server';

import { redirect } from 'next/navigation';
import {
  deleteMemoryById,
  rebuildAllMemorySummariesForUser,
  rebuildPetMemorySummary,
} from '@/lib/memory-service';
import {
  createServerSupabaseClient,
  hasSupabaseEnv,
} from '@/lib/supabase/server';

function toRedirectMessage(text: string) {
  return encodeURIComponent(text);
}

function buildMemoriesRedirect(params: {
  message?: string;
  error?: string;
  petId?: string | null;
}) {
  const search = new URLSearchParams();
  if (params.petId) search.set('pet_id', params.petId);
  if (params.message) search.set('message', params.message);
  if (params.error) search.set('error', params.error);
  const query = search.toString();
  return query ? `/memories?${query}` : '/memories';
}

async function requireUser() {
  if (!hasSupabaseEnv()) {
    redirect(
      '/login?error=' +
        toRedirectMessage(
          'Please configure Supabase environment variables first.'
        )
    );
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      '/login?message=' +
        toRedirectMessage('Please sign in first to manage memories.')
    );
  }

  return user;
}

export async function deleteMemoryAction(formData: FormData) {
  const user = await requireUser();
  const memoryId = String(formData.get('memoryId') || '').trim();
  const petId = String(formData.get('petId') || '').trim() || null;

  if (!memoryId) {
    redirect(
      buildMemoriesRedirect({
        petId,
        error: 'Missing memory ID. Could not delete.',
      })
    );
  }

  let redirectUrl = buildMemoriesRedirect({
    petId,
    error: 'Delete failed due to a server error. Please try again.',
  });

  try {
    const result = await deleteMemoryById({
      userId: user.id,
      memoryId,
    });

    if (!result.deleted) {
      redirectUrl = buildMemoriesRedirect({
        petId,
        error: 'Memory not found or already deleted.',
      });
    } else if (!result.summaryRefreshed) {
      redirectUrl = buildMemoriesRedirect({
        petId,
        message:
          'Memory deleted. Summary refresh failed temporarily — you can click Update Summary once.',
      });
    } else {
      redirectUrl = buildMemoriesRedirect({
        petId,
        message: 'Memory deleted. Summary has been refreshed.',
      });
    }
  } catch (error) {
    console.error('deleteMemoryAction failed:', error);
  }

  redirect(redirectUrl);
}

export async function refreshMemorySummariesAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get('petId') || '').trim() || null;

  let redirectUrl = buildMemoriesRedirect({
    petId,
    error:
      'Summary refresh failed temporarily. Please try again in a moment.',
  });

  try {
    if (petId) {
      const result = await rebuildPetMemorySummary({
        userId: user.id,
        petId,
      });

      redirectUrl = buildMemoriesRedirect({
        petId,
        message: `Updated memory summary for ${
          result.petName || 'this pet'
        }.`,
      });
    } else {
      const result = await rebuildAllMemorySummariesForUser(user.id);

      redirectUrl = buildMemoriesRedirect({
        message: `Updated memory summaries for ${result.count} pets.`,
      });
    }
  } catch (error) {
    console.error('refreshMemorySummariesAction failed:', error);
  }

  redirect(redirectUrl);
}
