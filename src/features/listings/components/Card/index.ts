import { Card } from './Card';
import { CardImage } from './Card.Image';
import { CardTitle } from './Card.Title';
import { CardLocation } from './Card.Location';
import { CardPrice } from './Card.Price';
import { CardRating } from './Card.Rating';
import { CardBadge } from './Card.Badge';

const CardCompound = Object.assign(Card, {
  Image: CardImage,
  Title: CardTitle,
  Location: CardLocation,
  Price: CardPrice,
  Rating: CardRating,
  Badge: CardBadge,
});

export { CardCompound as Card };
export { useCard } from './Card';
