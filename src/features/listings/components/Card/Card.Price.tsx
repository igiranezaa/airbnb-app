import type { ReactElement } from 'react';
import numeral from 'numeral';
import { useCard } from './Card';

export function CardPrice(): ReactElement {
  const { listing } = useCard();
  return (
    <p className="card__price">
      {numeral(listing.price).format('$0,0')} <small>/ night</small>
    </p>
  );
}
