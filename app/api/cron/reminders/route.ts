import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/server';
import { Friend } from '@/lib/types';
import { daysUntilBirthday, formatBirthday } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REMINDER_WINDOW_DAYS = 7;

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
        const pendingGifts = (f.gifts ?? []).filter((g) => g.status === 'idea').length;
        const giftNote =
          pendingGifts > 0
            ? `${pendingGifts} gift idea${pendingGifts > 1 ? 's' : ''} saved, not yet purchased`
            : 'no gift picked yet';
        return `<li><strong>${f.name}</strong> — ${formatBirthday(f.birthday)} (${giftNote})</li>`;
      })
      .join('');

    await resend.emails.send({
      from: process.env.REMINDER_FROM_EMAIL || 'Presently <onboarding@resend.dev>',
      to: email,
      subject: `🎀 ${userFriends.length === 1 ? `${userFriends[0].name}'s birthday` : 'Birthdays'} coming up in a week`,
      html: `
        <div style="font-family: sans-serif; font-size: 14px; color: #1F1B2E;">
          <p>Heads up — these birthdays are one week away:</p>
          <ul>${rows}</ul>
          <p>Open Presently to check gift ideas or mark one as sent.</p>
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
