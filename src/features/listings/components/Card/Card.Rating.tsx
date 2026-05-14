import type { ReactElement } from 'react';
import { FaStar } from 'react-icons/fa';
import { useCard } from './Card';

export function CardRating(): ReactElement {
  const { listing } = useCard();
  return (
    <span className="card__rating">
      <FaStar className="card__star" />
      {listing.rating.toFixed(2)}
      {listing.reviewCount > 0 && (
        <span className="card__review-count">({listing.reviewCount.toLocaleString()})</span>
      )}
    </span>
  );
}
