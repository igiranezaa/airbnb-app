import type { ReactElement } from 'react';
import { useCard } from './Card';

export function CardTitle(): ReactElement {
  const { listing } = useCard();
  return <h3 className="card__title">{listing.title}</h3>;
}
