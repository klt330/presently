'use client';

import { Gift } from '@/lib/types';
import { giftHref, priceLabel } from '@/lib/gift-utils';

export function LatestGiftPreview({ gift }: { gift: Gift }) {
  const price = priceLabel(gift);

  return (
    <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-dashed border-line text-xs">
      <span className="text-[10px] uppercase tracking-wide text-muted flex-shrink-0">Latest idea</span>
      <a
        href={giftHref(gift)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-header font-medium truncate hover:underline min-w-0"
      >
        {gift.title}
      </a>
      {price && (
        <span className="ml-auto flex-shrink-0 bg-cream text-ink font-mono text-[10.5px] px-1.5 py-0.5 rounded-md">
          {price}
        </span>
      )}
    </div>
  );
}
