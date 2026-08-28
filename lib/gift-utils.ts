import { Gift } from './types';

/** Real links go straight through; typed-only ideas open a Google search instead. */
export function giftHref(gift: Pick<Gift, 'url' | 'title'>): string {
  return gift.url || `https://www.google.com/search?q=${encodeURIComponent(gift.title)}`;
}

/** Only linked gifts show a price at all — nothing to price for a typed-only idea. */
export function priceLabel(gift: Pick<Gift, 'url' | 'price'>): string {
  if (!gift.url) return '';
  return gift.price ? `$${gift.price}` : '$TBD';
}
