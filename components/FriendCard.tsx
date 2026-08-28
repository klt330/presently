import Link from 'next/link';
import { Friend, EVENT_EMOJI, initials, avatarTextColor } from '@/lib/types';
import { formatBirthday, daysUntilBirthday } from '@/lib/date-utils';
import { BirthdayBadge } from './BirthdayBadge';
import { LatestGiftPreview } from './LatestGiftPreview';

export function FriendCard({ friend, expanded = false }: { friend: Friend; expanded?: boolean }) {
  const daysUntil = daysUntilBirthday(friend.birthday, friend.timezone);
  const gifts = friend.gifts ?? [];
  const pending = gifts.filter((g) => g.status === 'idea').length;
  const sent = gifts.filter((g) => g.status === 'sent' || g.status === 'purchased').length;
  const latest = gifts.length ? gifts[gifts.length - 1] : null;

  return (
    <Link
      href={`/friends/${friend.id}`}
      className="card-hover group flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-card hover:border-header/40 transition-colors focus-ring"
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-display font-600 text-md"
        style={{ backgroundColor: friend.color, color: avatarTextColor(friend.color) }}
      >
        {initials(friend.name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none" title={friend.event_type}>{EVENT_EMOJI[friend.event_type]}</span>
          <span className="font-medium text-md truncate">{friend.name}</span>
          <BirthdayBadge daysUntil={daysUntil} />
        </div>
        <div className="text-xs text-muted mt-0.5 truncate">
          {formatBirthday(friend.birthday)}
          {friend.city ? ` · ${friend.city}` : ''}
          {pending > 0 ? ` · ${pending} gift idea${pending > 1 ? 's' : ''}` : ''}
          {pending === 0 && sent > 0 ? ` · sorted ✓` : ''}
        </div>
        {expanded && latest && <LatestGiftPreview gift={latest} />}
      </div>
    </Link>
  );
}

