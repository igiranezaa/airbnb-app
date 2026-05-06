export interface Listing {
  id: number;
  title: string;
  location: string;
  price: number;
  rating: number;
  superhost: boolean;
  available: boolean;
  availableFrom: string;
  img: string;
  category: 'beach' | 'mountain' | 'city' | 'countryside';
}
