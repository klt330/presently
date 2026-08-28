'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AVATAR_COLORS } from '@/lib/types';

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function addFriend(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get('name') || '').trim();
  const birthday = String(formData.get('birthday') || '');
  const timezone = String(formData.get('timezone') || 'America/New_York');
  const city = String(formData.get('city') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const bio = String(formData.get('bio') || '').trim() || null;
  const birth_year_known = formData.get('birth_year_known') === 'on';
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  if (!name || !birthday) return;

  const { data, error } = await supabase
    .from('friends')
    .insert({
      user_id: user.id,
      name,
      birthday,
      birth_year_known,
      timezone,
      city,
      address,
      bio,
      color,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/friends');
  redirect(`/friends/${data.id}`);
}

export async function updateFriend(friendId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const name = String(formData.get('name') || '').trim();
  const birthday = String(formData.get('birthday') || '');
  const timezone = String(formData.get('timezone') || 'America/New_York');
  const city = String(formData.get('city') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const bio = String(formData.get('bio') || '').trim() || null;
  const birth_year_known = formData.get('birth_year_known') === 'on';

  const { error } = await supabase
    .from('friends')
    .update({ name, birthday, timezone, city, address, bio, birth_year_known })
    .eq('id', friendId);

  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/friends');
  revalidatePath(`/friends/${friendId}`);
  redirect(`/friends/${friendId}`);
}

export async function deleteFriend(friendId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from('friends').delete().eq('id', friendId);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/friends');
  redirect('/friends');
}

export async function addGift(friendId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const rawUrl = String(formData.get('url') || '').trim();
  let title = String(formData.get('title') || '').trim();
  let image_url: string | null = null;
  let source: 'manual' | 'auto' = 'manual';

  if (rawUrl) {
    try {
      const unfurled = await unfurlUrl(rawUrl);
      if (!title) title = unfurled.title || rawUrl;
      image_url = unfurled.image;
      source = 'auto';
    } catch {
      if (!title) title = rawUrl;
    }
  }

  if (!title) return;

  const { error } = await supabase.from('gifts').insert({
    friend_id: friendId,
    title,
    url: rawUrl || null,
    image_url,
    status: 'idea',
    source,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/friends/${friendId}`);
}

export async function updateGiftStatus(friendId: string, giftId: string, status: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from('gifts').update({ status }).eq('id', giftId);
  if (error) throw new Error(error.message);
  revalidatePath(`/friends/${friendId}`);
}

export async function deleteGift(friendId: string, giftId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from('gifts').delete().eq('id', giftId);
  if (error) throw new Error(error.message);
  revalidatePath(`/friends/${friendId}`);
}

/** Fetches a title + preview image for a pasted gift/Amazon link via Microlink's free API. */
export async function unfurlUrl(url: string): Promise<{ title: string | null; image: string | null }> {
  const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return { title: null, image: null };
  const json = await res.json();
  if (json.status !== 'success') return { title: null, image: null };
  return {
    title: json.data?.title ?? null,
    image: json.data?.image?.url ?? json.data?.logo?.url ?? null,
  };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
