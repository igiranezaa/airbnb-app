import type { ReactElement } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useCard } from './Card';

export function CardLocation(): ReactElement {
  const { listing } = useCard();
  return (
    <p className="card__location">
      <FaMapMarkerAlt className="card__location-icon" />
      {listing.location}
    </p>
  );
}
