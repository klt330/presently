import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchAll } from '@/lib/supabase/fetch-all';
import { Friend, EVENT_EMOJI, DEFAULT_LEAD_DAYS } from '@/lib/types';
import { daysUntilBirthday, formatBirthday, nextOccurrenceDate, suggestedOrderByDate } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SITE_URL = 'https://presently.party';
const MAX_ATTEMPTS = 3;
// Shipping buffer used by suggestedOrderByDate; inside it, "buy by" would be in the past.
const ORDER_BUFFER_DAYS = 5;

type Kind = 'early' | 'day_of';
type Item = { friend: Friend; kind: Kind; occasionDate: string; daysUntil: number };
type Profile = { user_id: string; email: string | null; default_lead_days: number; day_of_enabled: boolean };
type LogRow = { friend_id: string; occasion_date: string; kind: Kind; status: 'sent' | 'failed'; attempts: number };

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

const logKey = (friendId: string, occasionDate: string, kind: Kind) => `${friendId}|${occasionDate}|${kind}`;

function giftLine(friend: Friend) {
  const ideas = (friend.gifts ?? []).filter((g) => g.status === 'idea');
  if (ideas.length === 0) return 'No gift ideas saved yet.';
  const shown = ideas
    .slice(0, 3)
    .map((g) =>
      g.url && /^https?:\/\//i.test(g.url)
        ? `<a href="${escapeHtml(g.url)}" style="color: #C2023F;">${escapeHtml(g.title)}</a>`
        : escapeHtml(g.title)
    )
    .join(', ');
  return `Top ideas: ${shown}${ideas.length > 3 ? ` and ${ideas.length - 3} more` : ''}`;
}

function earlyRow({ friend, daysUntil }: Item) {
  const when = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
  const buy =
    daysUntil > ORDER_BUFFER_DAYS
      ? `<strong>Buy by ${suggestedOrderByDate(friend.birthday, friend.timezone)}</strong> so it arrives in time, their time.`
      : '<strong>Order today</strong> if it needs shipping.';
  return `
    <li style="margin-bottom: 14px;">
      ${EVENT_EMOJI[friend.event_type]} <strong>${escapeHtml(friend.name)}</strong>, ${formatBirthday(friend.birthday)} (${when})<br>
      ${buy}<br>
      ${giftLine(friend)}<br>
      <a href="${SITE_URL}/friends/${friend.id}" style="color: #C2023F;">See ${escapeHtml(friend.name)}'s ideas</a>
    </li>`;
}

function dayOfRow({ friend }: Item) {
  return `
    <li style="margin-bottom: 14px;">
      ${EVENT_EMOJI[friend.event_type]} It's <strong>${escapeHtml(friend.name)}</strong>'s ${escapeHtml(friend.event_type.toLowerCase())} today.
      Send them a message.<br>
      <a href="${SITE_URL}/friends/${friend.id}" style="color: #C2023F;">Open ${escapeHtml(friend.name)} in Presently</a>
    </li>`;
}

function subjectFor(items: Item[]) {
  if (items.length === 1) {
    const { friend, kind, daysUntil } = items[0];
    const occasion = `${friend.name}'s ${friend.event_type.toLowerCase()}`;
    if (kind === 'day_of') return `🎂 It's ${occasion} today`;
    return `🎀 ${occasion} is ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`;
  }
  return items.some((i) => i.kind === 'day_of') ? '🎂 Birthdays today and coming up' : `🎀 ${items.length} occasions coming up`;
}

function emailHtml(items: Item[]) {
  const today = items.filter((i) => i.kind === 'day_of');
  const soon = items.filter((i) => i.kind === 'early').sort((a, b) => a.daysUntil - b.daysUntil);
  return `
    <div style="font-family: sans-serif; font-size: 14px; color: #413B3B; line-height: 1.5;">
      ${today.length ? `<p><strong>Today</strong></p><ul style="padding-left: 18px;">${today.map(dayOfRow).join('')}</ul>` : ''}
      ${soon.length ? `<p><strong>Coming up</strong></p><ul style="padding-left: 18px;">${soon.map(earlyRow).join('')}</ul>` : ''}
      <p style="color: #8C8171; font-size: 12px;">You can change when these arrive in <a href="${SITE_URL}/settings" style="color: #8C8171;">Settings</a>.</p>
    </div>`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  let friends: Friend[];
  let profiles: Profile[];
  let logRows: LogRow[];
  try {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    [friends, profiles, logRows] = await Promise.all([
      fetchAll<Friend>((from, to) => supabase.from('friends').select('*, gifts(*)').order('id').range(from, to)),
      fetchAll<Profile>((from, to) =>
        supabase.from('profiles').select('user_id, email, default_lead_days, day_of_enabled').order('user_id').range(from, to)
      ),
      fetchAll<LogRow>((from, to) =>
        supabase
          .from('reminder_log')
          .select('friend_id, occasion_date, kind, status, attempts')
          .gte('occasion_date', recent)
          .order('id')
          .range(from, to)
      ),
    ]);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const profileByUser = new Map(profiles.map((p) => [p.user_id, p]));
  const logByKey = new Map(logRows.map((r) => [logKey(r.friend_id, r.occasion_date, r.kind), r]));
  const thisYear = new Date().getUTCFullYear();

  const byUser = new Map<string, Item[]>();
  for (const friend of friends) {
    const daysUntil = daysUntilBirthday(friend.birthday, friend.timezone);
    if (!Number.isFinite(daysUntil)) continue;
    const occasionDate = nextOccurrenceDate(friend.birthday, friend.timezone);
    const profile = profileByUser.get(friend.user_id);
    const lead = friend.lead_days ?? profile?.default_lead_days ?? DEFAULT_LEAD_DAYS;

    let kind: Kind | null = null;
    // Any day inside the window qualifies, so a missed run catches up the next day.
    if (daysUntil >= 1 && daysUntil <= lead) kind = 'early';
    else if (daysUntil === 0 && (profile?.day_of_enabled ?? true)) kind = 'day_of';
    if (!kind) continue;

    // The old job marked last_reminded_year when it sent its 7-day email; don't repeat that one.
    if (kind === 'early' && friend.last_reminded_year === thisYear && daysUntil < 7) continue;

    const prior = logByKey.get(logKey(friend.id, occasionDate, kind));
    if (prior && (prior.status === 'sent' || prior.attempts >= MAX_ATTEMPTS)) continue;

    const list = byUser.get(friend.user_id) ?? [];
    list.push({ friend, kind, occasionDate, daysUntil });
    byUser.set(friend.user_id, list);
  }

  let sent = 0;
  let failed = 0;

  for (const [userId, items] of byUser) {
    let email = profileByUser.get(userId)?.email ?? null;
    if (!email) {
      const { data } = await supabase.auth.admin.getUserById(userId);
      email = data?.user?.email ?? null;
    }
    if (!email) continue;

    let sendError: { message: string } | null = null;
    try {
      const result = await resend.emails.send({
        from: process.env.REMINDER_FROM_EMAIL || 'Presently <onboarding@resend.dev>',
        to: email,
        subject: subjectFor(items),
        html: emailHtml(items),
      });
      sendError = result.error;
    } catch (err) {
      sendError = { message: (err as Error).message || 'Send failed' };
    }

    const rows = items.map((i) => {
      const prior = logByKey.get(logKey(i.friend.id, i.occasionDate, i.kind));
      return {
        user_id: userId,
        friend_id: i.friend.id,
        occasion_date: i.occasionDate,
        kind: i.kind,
        status: sendError ? 'failed' : 'sent',
        attempts: (prior?.attempts ?? 0) + 1,
        error: sendError ? sendError.message.slice(0, 500) : null,
        sent_at: new Date().toISOString(),
      };
    });
    const { error: logError } = await supabase
      .from('reminder_log')
      .upsert(rows, { onConflict: 'friend_id,occasion_date,kind' });
    if (logError) console.error('Could not write reminder_log', logError.message);

    if (sendError) failed += 1;
    else sent += 1;
  }

  return NextResponse.json({ checked: friends.length, remindersSent: sent, remindersFailed: failed });
}
