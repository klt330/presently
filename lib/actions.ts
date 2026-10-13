'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AVATAR_COLORS, EVENT_TYPES, EventType, DEFAULT_LEAD_DAYS, LEAD_DAY_OPTIONS, parseLeadDays } from '@/lib/types';
import { COMMON_TIMEZONES } from '@/lib/date-utils';
import { suggestGiftIdeas, type GiftIdeasResult, type GiftProfile } from '@/lib/gift-ideas';
import { claudeGiftIdeas } from '@/lib/claude-gift-ideas';

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

// Cycle through the four brand colors in creation order rather than random,
// so a person's friend list doesn't end up lopsided toward one color.
async function nextAvatarColor(supabase: ReturnType<typeof createClient>, userId: string) {
  const { count } = await supabase
    .from('friends')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return AVATAR_COLORS[(count ?? 0) % AVATAR_COLORS.length];
}

export type QuickAddState = {
  status: 'idle' | 'added' | 'error';
  message: string;
  // Increments on every successful add so the form can reset even when two
  // friends in a row share a name.
  added: number;
};

export async function quickAddFriend(prev: QuickAddState, formData: FormData): Promise<QuickAddState> {
  const { supabase, user } = await requireUser();
  const fail = (message: string): QuickAddState => ({ ...prev, status: 'error', message });

  const name = String(formData.get('name') || '').trim();
  const month = Number(formData.get('month'));
  const day = Number(formData.get('day'));
  const yearRaw = String(formData.get('year') || '').trim();
  const tzRaw = String(formData.get('timezone') || '');

  if (!name) return fail('Add a name.');
  if (!month || !day) return fail('Pick a month and day.');

  const birth_year_known = yearRaw !== '';
  const thisYear = new Date().getFullYear();
  if (birth_year_known && !/^\d{4}$/.test(yearRaw)) return fail('Year should look like 1990.');
  // 2000 is a leap year, so Feb 29 birthdays still fit when the year is unknown.
  const year = birth_year_known ? Number(yearRaw) : 2000;
  if (year < 1900 || year > thisYear) return fail(`Year should be between 1900 and ${thisYear}.`);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1) return fail("That date doesn't exist.");

  const pad = (n: number) => String(n).padStart(2, '0');
  const timezone = COMMON_TIMEZONES.some((t) => t.value === tzRaw) ? tzRaw : 'America/New_York';

  const { error } = await supabase.from('friends').insert({
    user_id: user.id,
    name,
    event_type: 'Birthday',
    birthday: `${year}-${pad(month)}-${pad(day)}`,
    birth_year_known,
    timezone,
    color: await nextAvatarColor(supabase, user.id),
  });

  if (error) return fail("Couldn't save. Try again.");

  revalidatePath('/');
  revalidatePath('/friends');
  return { status: 'added', message: `Added ${name}. Who's next?`, added: prev.added + 1 };
}

function parseEventType(raw: FormDataEntryValue | null): EventType {
  const value = String(raw || '');
  return (EVENT_TYPES as string[]).includes(value) ? (value as EventType) : 'Birthday';
}

export async function addFriend(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get('name') || '').trim();
  const event_type = parseEventType(formData.get('event_type'));
  const birthday = String(formData.get('birthday') || '');
  const timezone = String(formData.get('timezone') || 'America/New_York');
  const city = String(formData.get('city') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const bio = String(formData.get('bio') || '').trim() || null;
  const birth_year_known = formData.get('birth_year_known') === 'on';
  const lead_days = parseLeadDays(formData.get('lead_days'));

  if (!name || !birthday) return;

  const color = await nextAvatarColor(supabase, user.id);

  const { data, error } = await supabase
    .from('friends')
    .insert({
      user_id: user.id,
      name,
      event_type,
      birthday,
      birth_year_known,
      timezone,
      city,
      address,
      bio,
      color,
      lead_days,
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
  const event_type = parseEventType(formData.get('event_type'));
  const birthday = String(formData.get('birthday') || '');
  const timezone = String(formData.get('timezone') || 'America/New_York');
  const city = String(formData.get('city') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const bio = String(formData.get('bio') || '').trim() || null;
  const birth_year_known = formData.get('birth_year_known') === 'on';
  const lead_days = parseLeadDays(formData.get('lead_days'));

  const { error } = await supabase
    .from('friends')
    .update({ name, event_type, birthday, timezone, city, address, bio, birth_year_known, lead_days })
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
  let price: string | null = null;
  let source: 'manual' | 'auto' = 'manual';

  if (rawUrl) {
    try {
      const unfurled = await unfurlUrl(rawUrl);
      if (!title) title = unfurled.title || rawUrl;
      image_url = unfurled.image;
      price = unfurled.price;
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
    price,
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

/**
 * Fetches a title, preview image, and price (where the page exposes e-commerce
 * metadata) for a pasted gift/Amazon link via Microlink's free API. Price is
 * null whenever the source page doesn't expose it — the UI shows "$TBD" in
 * that case rather than guessing.
 */
export async function unfurlUrl(
  url: string
): Promise<{ title: string | null; image: string | null; price: string | null }> {
  const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return { title: null, image: null, price: null };
  const json = await res.json();
  if (json.status !== 'success') return { title: null, image: null, price: null };
  const rawPrice = json.data?.price ?? json.data?.pricing?.amount ?? null;
  return {
    title: json.data?.title ?? null,
    image: json.data?.image?.url ?? json.data?.logo?.url ?? null,
    price: rawPrice != null ? String(rawPrice) : null,
  };
}

/** Suggestions only; nothing is saved until the user picks one. */
export async function generateGiftIdeas(friendId: string, alreadyShown: string[]): Promise<GiftIdeasResult> {
  const { supabase } = await requireUser();
  const { data: friend } = await supabase
    .from('friends')
    .select('bio, event_type, birthday, birth_year_known, city, timezone, gifts(title)')
    .eq('id', friendId)
    .single();
  if (!friend) return { ideas: [], personalized: false };

  const profile = friend as unknown as GiftProfile & { gifts: { title: string }[] | null };
  const saved = (profile.gifts ?? []).map((g) => g.title);
  const shown = Array.isArray(alreadyShown)
    ? alreadyShown.filter((t): t is string => typeof t === 'string').slice(0, 200)
    : [];
  const avoid = [...saved, ...shown];

  // Claude only helps when there's a note to read, so empty bios don't spend a credit.
  // The daily limit stays server-side: past it, users quietly get the built-in list.
  if (process.env.ANTHROPIC_API_KEY && profile.bio?.trim()) {
    const { data: used, error } = await supabase.rpc('claim_gift_idea_credit');
    if (error) {
      console.error('Could not check the Magic ideas limit', error.message);
    } else if (used !== null) {
      const ai = await claudeGiftIdeas(profile, avoid);
      if (ai && ai.length > 0) {
        const topUp =
          ai.length < 3 ? suggestGiftIdeas(profile, [...avoid, ...ai.map((i) => i.title)], 3 - ai.length).ideas : [];
        return { ideas: [...ai, ...topUp], personalized: true };
      }
    }
  }

  return suggestGiftIdeas(profile, avoid);
}

export async function updateReminderSettings(formData: FormData) {
  const { supabase, user } = await requireUser();
  const lead = Number(formData.get('default_lead_days'));
  const default_lead_days = (LEAD_DAY_OPTIONS as readonly number[]).includes(lead) ? lead : DEFAULT_LEAD_DAYS;
  const day_of_enabled = formData.get('day_of_enabled') === 'on';

  const { error } = await supabase
    .from('profiles')
    .update({ default_lead_days, day_of_enabled })
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);

  revalidatePath('/settings');
  redirect('/settings?saved=1');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

