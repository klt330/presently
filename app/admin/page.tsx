import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { fetchAll } from '@/lib/supabase/fetch-all';
import { DailyBarChart, type DailyPoint } from '@/components/DailyBarChart';

export const dynamic = 'force-dynamic';

type ProfileRow = { user_id: string; email: string | null; created_at: string; last_seen_at: string | null };
type ActivityRow = { user_id: string; day: string };
type FriendRow = { id: string; user_id: string; created_at: string };
type GiftRow = { friend_id: string; created_at: string };
type IdeaUsageRow = { day: string; count: number };
type ReminderRow = { user_id: string; status: 'sent' | 'failed'; sent_at: string };

const DAY_MS = 24 * 60 * 60 * 1000;
const utcDay = (iso: string) => iso.slice(0, 10);

function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * DAY_MS).toISOString().slice(0, 10));
}

function series(days: string[], dates: string[]): DailyPoint[] {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1);
  return days.map((day) => ({ day, value: counts.get(day) ?? 0 }));
}

function relative(iso: string | null) {
  if (!iso) return 'never';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3.5 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-display text-2xl leading-tight mt-0.5">{value}</div>
      {note && <div className="text-xs text-muted mt-0.5">{note}</div>}
    </div>
  );
}

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const service = createServiceClient();
  const { data: admin } = await service.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  // Pretend the page doesn't exist for everyone else.
  if (!admin) notFound();

  const days = lastNDays(30);
  const since = days[0];

  const [profiles, activity, friends, gifts, ideaUsage, reminders] = await Promise.all([
    fetchAll<ProfileRow>((f, t) =>
      service.from('profiles').select('user_id, email, created_at, last_seen_at').order('created_at').range(f, t)
    ),
    fetchAll<ActivityRow>((f, t) =>
      service.from('user_activity').select('user_id, day').gte('day', since).order('day').range(f, t)
    ),
    fetchAll<FriendRow>((f, t) => service.from('friends').select('id, user_id, created_at').order('created_at').range(f, t)),
    fetchAll<GiftRow>((f, t) => service.from('gifts').select('friend_id, created_at').order('created_at').range(f, t)),
    fetchAll<IdeaUsageRow>((f, t) =>
      service.from('gift_idea_usage').select('day, count').gte('day', since).order('day').range(f, t)
    ),
    fetchAll<ReminderRow>((f, t) =>
      service.from('reminder_log').select('user_id, status, sent_at').order('sent_at').range(f, t)
    ),
  ]);

  const today = days[days.length - 1];
  const weekAgo = days[days.length - 7];
  const twoWeeksAgo = new Date(Date.now() - 13 * DAY_MS).toISOString().slice(0, 10);

  const newThisWeek = profiles.filter((p) => utcDay(p.created_at) >= weekAgo).length;
  const newLastWeek = profiles.filter((p) => utcDay(p.created_at) >= twoWeeksAgo && utcDay(p.created_at) < weekAgo).length;
  const activeUsers = (from: string) => new Set(activity.filter((a) => a.day >= from).map((a) => a.user_id)).size;

  const friendOwner = new Map(friends.map((f) => [f.id, f.user_id]));
  const friendsPerUser = new Map<string, number>();
  for (const f of friends) friendsPerUser.set(f.user_id, (friendsPerUser.get(f.user_id) ?? 0) + 1);
  const giftsPerUser = new Map<string, number>();
  for (const g of gifts) {
    const owner = friendOwner.get(g.friend_id);
    if (owner) giftsPerUser.set(owner, (giftsPerUser.get(owner) ?? 0) + 1);
  }
  const remindedUsers = new Set(reminders.filter((r) => r.status === 'sent').map((r) => r.user_id));

  const total = profiles.length;
  const funnel = [
    { label: 'Signed up', count: total },
    { label: 'Added a friend', count: profiles.filter((p) => (friendsPerUser.get(p.user_id) ?? 0) >= 1).length },
    { label: 'Added 3+ friends', count: profiles.filter((p) => (friendsPerUser.get(p.user_id) ?? 0) >= 3).length },
    { label: 'Saved a gift idea', count: profiles.filter((p) => (giftsPerUser.get(p.user_id) ?? 0) >= 1).length },
    { label: 'Got a reminder email', count: profiles.filter((p) => remindedUsers.has(p.user_id)).length },
  ];

  const ideaDays = new Map<string, number>();
  for (const u of ideaUsage) ideaDays.set(u.day, (ideaDays.get(u.day) ?? 0) + u.count);
  const recentReminders = reminders.filter((r) => utcDay(r.sent_at) >= since);
  const failedReminders = recentReminders.filter((r) => r.status === 'failed').length;

  const users = [...profiles].sort((a, b) => (b.last_seen_at ?? '').localeCompare(a.last_seen_at ?? '')).slice(0, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display italic text-2xl">Usage</h1>
        <p className="text-xs text-muted mt-0.5">Only visible to admins. Days are in UTC. Activity tracking started with this dashboard.</p>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Total users" value={total} />
        <Stat
          label="New this week"
          value={newThisWeek}
          note={`${newLastWeek} the week before`}
        />
        <Stat label="Active today" value={activeUsers(today)} note={`${activeUsers(weekAgo)} this week · ${activeUsers(since)} in 30 days`} />
        <Stat
          label="Reminders sent (30 days)"
          value={recentReminders.length - failedReminders}
          note={failedReminders ? `${failedReminders} failed` : 'none failed'}
        />
      </section>

      <section className="rounded-2xl border border-line bg-surface p-3.5">
        <h2 className="text-xs text-muted uppercase tracking-wide mb-3">How far users get</h2>
        <div className="space-y-2">
          {funnel.map((step) => {
            const pct = total ? Math.round((step.count / total) * 100) : 0;
            return (
              <div key={step.label}>
                <div className="flex justify-between text-sm mb-0.5">
                  <span>{step.label}</span>
                  <span className="text-muted">
                    {step.count} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-line overflow-hidden">
                  <div className="h-full rounded-full bg-header" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-2">
        <DailyBarChart title="New sign-ups" points={series(days, profiles.map((p) => utcDay(p.created_at)))} />
        <DailyBarChart title="Active users" points={series(days, activity.map((a) => a.day))} color="#413B3B" />
        <DailyBarChart title="Friends added" points={series(days, friends.map((f) => utcDay(f.created_at)))} />
        <DailyBarChart title="Gift ideas saved" points={series(days, gifts.map((g) => utcDay(g.created_at)))} />
        <DailyBarChart
          title="AI Magic ideas requests"
          points={days.map((day) => ({ day, value: ideaDays.get(day) ?? 0 }))}
          color="#413B3B"
        />
        <DailyBarChart
          title="Reminder emails sent"
          points={series(days, recentReminders.filter((r) => r.status === 'sent').map((r) => utcDay(r.sent_at)))}
        />
      </section>

      <section className="rounded-2xl border border-line bg-surface p-3.5">
        <h2 className="text-xs text-muted uppercase tracking-wide mb-2">Users (most recently active first)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="font-normal py-1.5 pr-3">Email</th>
                <th className="font-normal py-1.5 pr-3">Signed up</th>
                <th className="font-normal py-1.5 pr-3">Last seen</th>
                <th className="font-normal py-1.5 pr-3 text-right">Friends</th>
                <th className="font-normal py-1.5 text-right">Gift ideas</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-t border-line">
                  <td className="py-1.5 pr-3 truncate max-w-[14rem]">{u.email ?? '—'}</td>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{relative(u.created_at)}</td>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{relative(u.last_seen_at)}</td>
                  <td className="py-1.5 pr-3 text-right">{friendsPerUser.get(u.user_id) ?? 0}</td>
                  <td className="py-1.5 text-right">{giftsPerUser.get(u.user_id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
