import type { ReactElement } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useCard } from './Card';

export function CardImage(): ReactElement {
  const { listing, saved, onToggleSave } = useCard();
  return (
    <div className="card__image-wrap">
      <img src={listing.img} alt={listing.title} className="card__image" loading="lazy" />
      <button
        className={`card__heart${saved ? ' card__heart--saved' : ''}`}
        aria-label={saved ? 'Unsave listing' : 'Save listing'}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onToggleSave(listing.id, listing.title);
        }}
      >
        {saved ? <FaHeart /> : <FaRegHeart />}
      </button>
    </div>
  );
}
