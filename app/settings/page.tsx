import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut, updateReminderSettings } from '@/lib/actions';
import { DEFAULT_LEAD_DAYS, LEAD_DAY_OPTIONS, leadDaysLabel } from '@/lib/types';
import { formatBirthday } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ searchParams }: { searchParams: { saved?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: profile }, { data: recent }] = await Promise.all([
    supabase.from('profiles').select('default_lead_days, day_of_enabled').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('reminder_log')
      .select('kind, status, sent_at, occasion_date, friends(name)')
      .order('sent_at', { ascending: false })
      .limit(5),
  ]);

  const leadDays = profile?.default_lead_days ?? DEFAULT_LEAD_DAYS;
  const dayOf = profile?.day_of_enabled ?? true;
  const log = (recent ?? []) as unknown as {
    kind: 'early' | 'day_of';
    status: 'sent' | 'failed';
    sent_at: string;
    occasion_date: string;
    friends: { name: string } | null;
  }[];

  return (
    <div className="max-w-md space-y-4">
      <h1 className="font-display italic text-2xl">Settings</h1>

      <div className="rounded-xl border border-line px-3.5 py-3">
        <div className="text-xs text-muted uppercase tracking-wide mb-0.5">Logged in as</div>
        <div className="text-sm font-medium">{user.email}</div>
      </div>

      <form action={updateReminderSettings} className="rounded-xl border border-line px-3.5 py-3 space-y-3">
        <div className="text-xs text-muted uppercase tracking-wide">Reminder emails</div>
        <label className="block">
          <span className="block text-sm mb-1">Send a heads-up with gift ideas</span>
          <select
            name="default_lead_days"
            defaultValue={leadDays}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm bg-white focus-ring"
          >
            {LEAD_DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {leadDaysLabel(d)}
              </option>
            ))}
          </select>
          <span className="block text-xs text-muted mt-1">
            Applies to everyone unless you pick a different time on a friend&apos;s page.
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="day_of_enabled" defaultChecked={dayOf} className="rounded focus-ring" />
          Also nudge me on the day
        </label>
        <div className="flex items-center gap-3">
          <button className="rounded-xl bg-header text-white text-sm font-medium px-4 py-2 shadow-pop hover:bg-header-dark transition-colors focus-ring">
            Save
          </button>
          {searchParams.saved && <span className="text-xs text-muted">Saved</span>}
        </div>
      </form>

      {log.length > 0 && (
        <div className="rounded-xl border border-line px-3.5 py-3">
          <div className="text-xs text-muted uppercase tracking-wide mb-2">Recent reminders</div>
          <ul className="space-y-1.5 text-sm">
            {log.map((r) => (
              <li key={`${r.sent_at}-${r.kind}-${r.occasion_date}`} className="flex justify-between gap-3">
                <span>
                  {r.friends?.name ?? 'A friend'} · {r.kind === 'day_of' ? 'on the day' : 'heads-up'} for{' '}
                  {formatBirthday(r.occasion_date)}
                </span>
                <span className={r.status === 'sent' ? 'text-muted' : 'text-header-dark'}>
                  {r.status === 'sent'
                    ? new Date(r.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Failed, retrying'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={signOut}>
        <button className="w-full rounded-xl border border-line text-sm font-medium py-2.5 hover:border-header/40 transition-colors focus-ring">
          Log out
        </button>
      </form>
    </div>
  );
}
