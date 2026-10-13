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

  // date-fns-tz returns Invalid Date for Feb 29 in a non-leap year, so celebrate on Feb 28 instead.
  const onYear = (year: number) => {
    const day = mm === '02' && dd === '29' && !isLeapYear(year) ? '28' : dd;
    return fromZonedTime(`${year}-${mm}-${day}T00:00:00`, timezone);
  };

  let candidate = onYear(thisYear);
  if (candidate < startOfTodayZoned) {
    candidate = onYear(thisYear + 1);
  }
  return candidate;
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** The next occurrence as a calendar date in their timezone, e.g. "2027-02-28". */
export function nextOccurrenceDate(birthday: string, timezone: string): string {
  return formatTz(nextBirthdayUTC(birthday, timezone), 'yyyy-MM-dd', { timeZone: timezone });
}

export function daysUntilBirthday(birthday: string, timezone: string): number {
  const next = nextBirthdayUTC(birthday, timezone);
  const diffMs = next.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/** Age they're turning (or anniversary year) on the next occurrence; null if the date can't be resolved. */
export function ageAtNextBirthday(birthday: string, timezone: string): number | null {
  const next = nextBirthdayUTC(birthday, timezone);
  if (Number.isNaN(next.getTime())) return null;
  return Number(formatTz(next, 'yyyy', { timeZone: timezone })) - Number(birthday.slice(0, 4));
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
