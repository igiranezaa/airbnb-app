import type { ReactElement } from 'react';
import { useCard } from './Card';

export function CardBadge(): ReactElement | null {
  const { listing } = useCard();
  if (!listing.superhost && listing.price < 500) return null;
  return (
    <span className="card__badge">
      {listing.superhost ? 'Superhost' : 'Luxury'}
    </span>
  );
}
