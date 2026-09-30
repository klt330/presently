'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AVATAR_COLORS, EVENT_TYPES, EventType } from '@/lib/types';
import { COMMON_TIMEZONES } from '@/lib/date-utils';

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

  const { error } = await supabase
    .from('friends')
    .update({ name, event_type, birthday, timezone, city, address, bio, birth_year_known })
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

const GIFT_KEYWORDS: { match: RegExp; ideas: string[] }[] = [
  { match: /cook|kitchen|cast.iron|chef/i, ideas: ['Enameled dutch oven', 'Personalized cutting board', 'Spice subscription box', "Sharp chef's knife set"] },
  { match: /vinyl|record|music/i, ideas: ['Record cleaning kit', 'Turntable slipmat', 'Gift card to a local record shop', 'Vinyl storage crate'] },
  { match: /tea|cold|always cold|blanket/i, ideas: ['Wool throw blanket', 'Loose-leaf tea sampler', 'Heated pour-over kettle', 'Cozy slipper socks'] },
  { match: /photo|film|camera/i, ideas: ['Roll of 35mm film', 'Camera strap', 'Photo book of recent trips', 'Darkroom print class'] },
  { match: /coffee|espresso|cold brew/i, ideas: ['Bag of single-origin beans', 'Pour-over dripper', 'Cold brew concentrate maker'] },
  { match: /ceramic|pottery|clay/i, ideas: ['Pottery studio class', 'Glazing tool set', 'Handmade ceramic mug'] },
  { match: /dog|golden retriever|pet/i, ideas: ['Personalized pet bandana', 'Durable chew toy', 'Dog treat subscription box'] },
  { match: /garden|plant|succulent/i, ideas: ['Rare houseplant', 'Ceramic planter set', 'Gardening tool kit'] },
  { match: /run|hik|climb|outdoor/i, ideas: ['Insulated water bottle', 'Trail running socks', 'Portable hammock'] },
  { match: /read|book|novel/i, ideas: ['Indie bookstore gift card', 'Cozy reading blanket', 'Book light'] },
];

const GIFT_FALLBACK = [
  'A handwritten card with a shared memory',
  'A small plant for their desk',
  'A gift card to their favorite spot',
  'A cozy candle',
  'A nice notebook and pen set',
];

/**
 * Drafts a gift idea from a friend's bio keywords. Purely a suggestion —
 * doesn't touch the database. The client drops the result into the title field.
 */
export async function generateGiftIdea(friendId: string): Promise<string> {
  const { supabase } = await requireUser();
  const { data: friend } = await supabase.from('friends').select('bio').eq('id', friendId).single();
  const bio = (friend?.bio || '').toLowerCase();

  let pool: string[] = [];
  for (const k of GIFT_KEYWORDS) {
    if (k.match.test(bio)) pool = pool.concat(k.ideas);
  }
  if (pool.length === 0) pool = GIFT_FALLBACK;

  return pool[Math.floor(Math.random() * pool.length)];
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

