import Link from 'next/link';
import { Friend, EVENT_EMOJI, initials, avatarTextColor } from '@/lib/types';
import { formatBirthday, daysUntilBirthday } from '@/lib/date-utils';
import { giftHref, priceLabel } from '@/lib/gift-utils';
import { BirthdayBadge } from './BirthdayBadge';

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
        {expanded && latest && (
          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-dashed border-line text-xs">
            <span className="text-[10px] uppercase tracking-wide text-muted flex-shrink-0">Latest idea</span>
            <a
              href={giftHref(latest)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-header font-medium truncate hover:underline min-w-0"
            >
              {latest.title}
            </a>
            {priceLabel(latest) && (
              <span className="ml-auto flex-shrink-0 bg-cream text-ink font-mono text-[10.5px] px-1.5 py-0.5 rounded-md">
                {priceLabel(latest)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

