import { createClient } from '@/lib/supabase/server';
import { Friend } from '@/lib/types';
import { daysUntilBirthday } from '@/lib/date-utils';
import { FriendCard } from '@/components/FriendCard';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: friends } = await supabase.from('friends').select('*, gifts(*)');

  const list = (friends ?? []) as unknown as Friend[];
  const sorted = [...list].sort(
    (a, b) => daysUntilBirthday(a.birthday, a.timezone) - daysUntilBirthday(b.birthday, b.timezone)
  );

  const soon = sorted.filter((f) => daysUntilBirthday(f.birthday, f.timezone) <= 7);
  const later = sorted.filter((f) => daysUntilBirthday(f.birthday, f.timezone) > 7);

  if (list.length === 0) {
    return (
      <EmptyState
        emoji="🎂"
        title="No birthdays yet"
        body="Add your first friend to start tracking birthdays and gift ideas."
        actionHref="/friends/new"
        actionLabel="+ Add your first friend"
      />
    );
  }

  return (
    <div className="space-y-8">
      {soon.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2.5">
            Coming up this week
          </h2>
          <div className="space-y-2">
            {soon.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        </section>
      )}

      {later.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2.5">
            Later on
          </h2>
          <div className="space-y-2">
            {later.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
