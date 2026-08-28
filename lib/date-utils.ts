import { fromZonedTime, toZonedTime, format as formatTz } from 'date-fns-tz';

/**
 * Birthdays are stored as "YYYY-MM-DD" (the year is a placeholder when
 * unknown). All the helpers below only ever look at month/day, but do the
 * "what's the next occurrence" math in the friend's own timezone so a
 * birthday that's already passed today in Tokyo but not yet in Los Angeles
 * is handled correctly.
 */

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function nextBirthdayUTC(birthday: string, timezone: string): Date {
  const [, mm, dd] = birthday.split('-');
  const nowZoned = toZonedTime(new Date(), timezone);
  const thisYear = nowZoned.getFullYear();

  const startOfTodayZoned = fromZonedTime(
    `${thisYear}-${pad(nowZoned.getMonth() + 1)}-${pad(nowZoned.getDate())}T00:00:00`,
    timezone
  );

  let candidate = fromZonedTime(`${thisYear}-${mm}-${dd}T00:00:00`, timezone);
  if (candidate < startOfTodayZoned) {
    candidate = fromZonedTime(`${thisYear + 1}-${mm}-${dd}T00:00:00`, timezone);
  }
  return candidate;
}

export function daysUntilBirthday(birthday: string, timezone: string): number {
  const next = nextBirthdayUTC(birthday, timezone);
  const diffMs = next.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatBirthday(birthday: string): string {
  const [, mm, dd] = birthday.split('-').map(Number);
  const date = new Date(Date.UTC(2000, mm - 1, dd));
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function localTimeLabel(timezone: string): string {
  return formatTz(new Date(), 'h:mm a zzz', { timeZone: timezone });
}

/** Rough shipping-buffer heuristic — order by 5 days before, in their local time. */
export function suggestedOrderByDate(birthday: string, timezone: string): string {
  const next = nextBirthdayUTC(birthday, timezone);
  const orderBy = new Date(next.getTime() - 5 * 24 * 60 * 60 * 1000);
  return formatTz(orderBy, 'MMM d', { timeZone: timezone });
}

export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: 'Pacific/Honolulu', label: 'Honolulu (HST)' },
  { value: 'America/Anchorage', label: 'Anchorage (AKT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { value: 'America/Denver', label: 'Denver (MT)' },
  { value: 'America/Chicago', label: 'Chicago (CT)' },
  { value: 'America/New_York', label: 'New York (ET)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'Atlantic/Reykjavik', label: 'Reykjavik (GMT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/Athens', label: 'Athens (EET)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Karachi', label: 'Karachi (PKT)' },
  { value: 'Asia/Kolkata', label: 'Mumbai / Delhi (IST)' },
  { value: 'Asia/Dhaka', label: 'Dhaka (BST)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
];
