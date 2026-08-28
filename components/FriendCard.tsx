import Link from 'next/link';
import { Friend } from '@/lib/types';
import { formatBirthday, daysUntilBirthday } from '@/lib/date-utils';
import { BirthdayBadge } from './BirthdayBadge';

export function FriendCard({ friend }: { friend: Friend }) {
  const daysUntil = daysUntilBirthday(friend.birthday, friend.timezone);
  const gifts = friend.gifts ?? [];
  const pending = gifts.filter((g) => g.status === 'idea').length;
  const sent = gifts.filter((g) => g.status === 'sent' || g.status === 'purchased').length;

  return (
    <Link
      href={`/friends/${friend.id}`}
      className="card-hover group flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-card hover:border-ribbon/40 transition-colors focus-ring"
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-600 text-md"
        style={{ backgroundColor: friend.color }}
      >
        {friend.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-md truncate">{friend.name}</span>
          <BirthdayBadge daysUntil={daysUntil} />
        </div>
        <div className="text-xs text-muted mt-0.5 truncate">
          {formatBirthday(friend.birthday)}
          {friend.city ? ` · ${friend.city}` : ''}
          {pending > 0 ? ` · ${pending} gift idea${pending > 1 ? 's' : ''}` : ''}
          {pending === 0 && sent > 0 ? ` · sorted ✓` : ''}
        </div>
      </div>
    </Link>
  );
}
