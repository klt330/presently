'use client';

import Image from 'next/image';
import { Gift } from '@/lib/types';
import { giftHref, priceLabel } from '@/lib/gift-utils';
import { updateGiftStatus, deleteGift } from '@/lib/actions';

const STATUS_LABEL: Record<Gift['status'], string> = {
  idea: '💡 Idea',
  purchased: '🛍️ Purchased',
  sent: '🎁 Sent / given',
};

export function GiftItem({ friendId, gift }: { friendId: string; gift: Gift }) {
  const price = priceLabel(gift);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-cream border border-line overflow-hidden flex items-center justify-center">
        {gift.image_url ? (
          <Image src={gift.image_url} alt="" width={36} height={36} className="object-cover w-full h-full" unoptimized />
        ) : (
          <span className="text-sm">🎁</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <a
          href={giftHref(gift)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:text-header truncate block focus-ring"
          title={gift.url ? undefined : 'Search this idea on Google'}
        >
          {gift.title}
        </a>
      </div>

      {price && (
        <span className="flex-shrink-0 bg-cream text-ink font-mono text-[11px] px-1.5 py-1 rounded-md">
          {price}
        </span>
      )}

      <select
        value={gift.status}
        onChange={(e) => {
          updateGiftStatus(friendId, gift.id, e.target.value);
        }}
        className="text-xs rounded-lg border border-line bg-cream px-2 py-1.5 focus-ring"
      >
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <button
        aria-label={`Remove ${gift.title}`}
        onClick={() => {
          deleteGift(friendId, gift.id);
        }}
        className="text-muted hover:text-header-dark text-xs px-1 focus-ring"
      >
        ✕
      </button>
    </div>
  );
}
