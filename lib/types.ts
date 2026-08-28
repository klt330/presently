export type GiftStatus = 'idea' | 'purchased' | 'sent';

export interface Gift {
  id: string;
  friend_id: string;
  title: string;
  url: string | null;
  image_url: string | null;
  price: string | null; // display value only, e.g. "45.00" — null means unknown/TBD
  status: GiftStatus;
  source: 'manual' | 'auto';
  created_at: string;
}

export type EventType = 'Birthday' | 'Wedding anniversary' | 'Celebration' | "Child's birthday";

export const EVENT_TYPES: EventType[] = ['Birthday', 'Wedding anniversary', 'Celebration', "Child's birthday"];

export const EVENT_EMOJI: Record<EventType, string> = {
  'Birthday': '🎂',
  'Wedding anniversary': '💍',
  'Celebration': '🎉',
  "Child's birthday": '🧸',
};

export interface Friend {
  id: string;
  user_id: string;
  name: string;
  event_type: EventType;
  birthday: string; // stored as YYYY-MM-DD (year is a placeholder if unknown)
  birth_year_known: boolean;
  city: string | null;
  address: string | null;
  timezone: string; // IANA tz, e.g. "America/New_York"
  bio: string | null;
  color: string;
  last_reminded_year: number | null;
  created_at: string;
  gifts?: Gift[];
}

// The four approved brand colors, cycled through (not random) when a friend is created.
export const AVATAR_COLORS = ['#C2023F', '#413B3B', '#F4F26F', '#FFDCEC'];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Picks readable text color for a given avatar background by luminance,
// so it works for the four brand colors and any older/legacy color already stored.
export function avatarTextColor(bgHex: string): string {
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#413B3B' : '#FFFFFF';
}

