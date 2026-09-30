import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/server';
import { Friend, EVENT_EMOJI } from '@/lib/types';
import { daysUntilBirthday, formatBirthday, suggestedOrderByDate } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REMINDER_WINDOW_DAYS = 7;

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

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const thisYear = new Date().getFullYear();

  const { data: friends, error } = await supabase.from('friends').select('*, gifts(*)');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const due = ((friends ?? []) as unknown as Friend[]).filter((friend) => {
    const daysUntil = daysUntilBirthday(friend.birthday, friend.timezone);
    const alreadyRemindedThisCycle = friend.last_reminded_year === thisYear;
    return daysUntil === REMINDER_WINDOW_DAYS && !alreadyRemindedThisCycle;
  });

  // Group by owning user so each person gets one email listing all their upcoming birthdays.
  const byUser = new Map<string, Friend[]>();
  for (const friend of due) {
    const list = byUser.get(friend.user_id) ?? [];
    list.push(friend);
    byUser.set(friend.user_id, list);
  }

  let sent = 0;

  for (const [userId, userFriends] of byUser) {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (!email) continue;

    const rows = userFriends
      .map((f) => {
        const ideas = (f.gifts ?? []).filter((g) => g.status === 'idea');
        const shown = ideas
          .slice(0, 3)
          .map((g) =>
            g.url && /^https?:\/\//i.test(g.url)
              ? `<a href="${escapeHtml(g.url)}" style="color: #C2023F;">${escapeHtml(g.title)}</a>`
              : escapeHtml(g.title)
          )
          .join(', ');
        const more = ideas.length > 3 ? ` and ${ideas.length - 3} more` : '';
        const giftLine = ideas.length > 0 ? `Gift ideas: ${shown}${more}` : 'No gift ideas saved yet';
        return `
          <li style="margin-bottom: 12px;">
            ${EVENT_EMOJI[f.event_type]} <strong>${escapeHtml(f.name)}</strong>, ${formatBirthday(f.birthday)} (${escapeHtml(f.event_type)})<br>
            <strong>Buy by ${suggestedOrderByDate(f.birthday, f.timezone)}</strong> so it arrives in time, their time.<br>
            ${giftLine}
          </li>`;
      })
      .join('');

    await resend.emails.send({
      from: process.env.REMINDER_FROM_EMAIL || 'Presently <onboarding@resend.dev>',
      to: email,
      subject: `🎀 ${userFriends.length === 1 ? `${userFriends[0].name}'s ${userFriends[0].event_type.toLowerCase()}` : 'A few occasions'} coming up in a week`,
      html: `
        <div style="font-family: sans-serif; font-size: 14px; color: #413B3B;">
          <p>Heads up, these are one week away:</p>
          <ul style="padding-left: 18px;">${rows}</ul>
          <p><a href="https://presently.party" style="color: #C2023F;">Open Presently</a> to pick a gift or mark one as sent.</p>
        </div>
      `,
    });

    await supabase
      .from('friends')
      .update({ last_reminded_year: thisYear })
      .in(
        'id',
        userFriends.map((f) => f.id)
      );

    sent += 1;
  }

  return NextResponse.json({ checked: friends?.length ?? 0, remindersSent: sent });
}
