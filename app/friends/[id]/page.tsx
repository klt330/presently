import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Friend } from '@/lib/types';
import { formatBirthday, daysUntilBirthday, localTimeLabel, suggestedOrderByDate } from '@/lib/date-utils';
import { BirthdayBadge } from '@/components/BirthdayBadge';
import { GiftItem } from '@/components/GiftItem';
import { AddGiftForm } from '@/components/AddGiftForm';
import { deleteFriend } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function FriendDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from('friends')
    .select('*, gifts(*)')
    .eq('id', params.id)
    .single();

  const friend = data as unknown as Friend | null;
  if (!friend) notFound();

  const daysUntil = daysUntilBirthday(friend.birthday, friend.timezone);
  const gifts = (friend.gifts ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const hasGifts = gifts.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-600 text-xl flex-shrink-0"
            style={{ backgroundColor: friend.color }}
          >
            {friend.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display italic text-2xl leading-tight">{friend.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted mt-0.5">
              <span>{formatBirthday(friend.birthday)}</span>
              <BirthdayBadge daysUntil={daysUntil} />
            </div>
          </div>
        </div>
        <Link
          href={`/friends/${friend.id}/edit`}
          className="text-xs text-muted hover:text-ink border border-line rounded-lg px-2.5 py-1.5 focus-ring"
        >
          Edit
        </Link>
      </div>

      {friend.bio && (
        <p className="text-sm text-ink bg-canvas border border-line rounded-2xl px-3.5 py-3 italic">
          “{friend.bio}”
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        {friend.city && (
          <div className="rounded-xl border border-line px-3 py-2.5">
            <div className="text-xs text-muted">Location</div>
            <div>{friend.city}</div>
          </div>
        )}
        <div className="rounded-xl border border-line px-3 py-2.5">
          <div className="text-xs text-muted">Their local time</div>
          <div>{localTimeLabel(friend.timezone)}</div>
        </div>
        {friend.address && (
          <div className="rounded-xl border border-line px-3 py-2.5 sm:col-span-2">
            <div className="text-xs text-muted">Mailing address</div>
            <div className="whitespace-pre-line">{friend.address}</div>
          </div>
        )}
        {daysUntil <= 30 && daysUntil >= 0 && (
          <div className="rounded-xl border border-amber/40 bg-amber-soft px-3 py-2.5 sm:col-span-2">
            <div className="text-xs text-ink/70">Shipping heads-up</div>
            <div>Order by <strong>{suggestedOrderByDate(friend.birthday, friend.timezone)}</strong> to arrive in time, their time.</div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2.5">
          Gift ideas
        </h2>
        <div className="space-y-2 mb-3">
          {hasGifts ? (
            gifts.map((gift) => <GiftItem key={gift.id} friendId={friend.id} gift={gift} />)
          ) : (
            <p className="text-sm text-muted italic">
              No gift ideas yet — paste a link below, or check back soon for suggestions based on their bio.
            </p>
          )}
        </div>
        <AddGiftForm friendId={friend.id} />
      </div>

      <form action={deleteFriend.bind(null, friend.id)} className="pt-4 border-t border-line">
        <button className="text-xs text-muted hover:text-ribbon-dark focus-ring">
          Remove {friend.name} from Presently
        </button>
      </form>
    </div>
  );
}
