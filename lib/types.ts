export type GiftStatus = 'idea' | 'purchased' | 'sent';

export interface Gift {
  id: string;
  friend_id: string;
  title: string;
  url: string | null;
  image_url: string | null;
  status: GiftStatus;
  source: 'manual' | 'auto';
  created_at: string;
}

export interface Friend {
  id: string;
  user_id: string;
  name: string;
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

export const AVATAR_COLORS = [
  '#FF5D8F', // ribbon
  '#16A399', // bow
  '#FFB020', // amber
  '#7C6CF0', // periwinkle
  '#2FA8E0', // sky
  '#F0668C', // rose
];
