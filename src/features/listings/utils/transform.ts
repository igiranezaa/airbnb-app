import type { Listing, ListingType, ListingCategory, CancellationPolicy } from '../types';

export interface BackendListing {
  id: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: ListingType;
  amenities: string[];
  rating: number | null;
  reviewCount?: number;
  createdAt: string;
  updatedAt?: string;
  rooms: number;
  beds: number;
  bathrooms: number;
  photos: string[];
  houseRules: string | null;
  checkInMethod: string | null;
  checkOutMethod: string | null;
  instantBook: boolean;
  cancellationPolicy: CancellationPolicy;
  weekendPrice: number | null;
  weeklyDiscount: number;
  monthlyDiscount: number;
  extraGuestFee: number;
  cleaningFee: number;
  serviceFeePercent: number;
  taxPercent: number;
  minNights: number;
  maxNights: number | null;
  superhost: boolean;
  published: boolean;
  host?: { id: string; name: string; avatar?: string | null };
  _count?: { bookings: number; reviews?: number };
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | string | null;
  lng?: number | string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const TYPE_TO_CATEGORY: Record<ListingType, ListingCategory> = {
  VILLA: 'beach',
  CABIN: 'mountain',
  APARTMENT: 'city',
  HOUSE: 'countryside',
};

const CATEGORY_IMAGES: Record<ListingCategory, string> = {
  beach: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&h=260&fit=crop',
  mountain: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400&h=260&fit=crop',
  city: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=260&fit=crop',
  countryside: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=260&fit=crop',
};

const LOCATION_COORDS: Array<{ match: string; lat: number; lng: number }> = [
  { match: 'kigali', lat: -1.9441, lng: 30.0619 },
  { match: 'musanze', lat: -1.4998, lng: 29.6349 },
  { match: 'volcanoes', lat: -1.4700, lng: 29.5600 },
  { match: 'gisenyi', lat: -1.7028, lng: 29.2564 },
  { match: 'rubavu', lat: -1.6792, lng: 29.2619 },
  { match: 'kibuye', lat: -2.0603, lng: 29.3478 },
  { match: 'karongi', lat: -2.0603, lng: 29.3478 },
  { match: 'nyungwe', lat: -2.5297, lng: 29.2781 },
  { match: 'huye', lat: -2.5967, lng: 29.7394 },
  { match: 'butare', lat: -2.5967, lng: 29.7394 },
  { match: 'rwanda', lat: -1.9403, lng: 29.8739 },
];

function toCoordinate(value: number | string | null | undefined): number | undefined {
  if (value == null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function inferCoordinates(location: string): { lat?: number; lng?: number } {
  const normalized = location.toLowerCase();
  const found = LOCATION_COORDS.find(({ match }) => normalized.includes(match));
  return found ? { lat: found.lat, lng: found.lng } : {};
}

export function transformListing(b: BackendListing): Listing {
  const category = TYPE_TO_CATEGORY[b.type] ?? 'city';
  const firstPhoto = b.photos?.[0];
  const inferredCoords = inferCoordinates(b.location ?? '');
  const lat = toCoordinate(b.latitude) ?? toCoordinate(b.lat) ?? inferredCoords.lat;
  const lng = toCoordinate(b.longitude) ?? toCoordinate(b.lng) ?? inferredCoords.lng;
  return {
    id: b.id,
    title: b.title,
    description: b.description ?? '',
    location: b.location,
    price: b.pricePerNight,
    rating: b.rating ?? 0,
    reviewCount: b.reviewCount ?? b._count?.reviews ?? 0,
    superhost: b.superhost ?? false,
    available: true,
    availableFrom: b.createdAt.slice(0, 10),
    img: firstPhoto ?? CATEGORY_IMAGES[category],
    photos: b.photos ?? [],
    category,
    rooms: b.rooms ?? 1,
    beds: b.beds ?? 1,
    bathrooms: b.bathrooms ?? 1,
    guests: b.guests,
    amenities: b.amenities ?? [],
    houseRules: b.houseRules ?? null,
    checkInMethod: b.checkInMethod ?? null,
    checkOutMethod: b.checkOutMethod ?? null,
    instantBook: b.instantBook ?? false,
    cancellationPolicy: b.cancellationPolicy ?? 'FLEXIBLE',
    weekendPrice: b.weekendPrice ?? null,
    weeklyDiscount: b.weeklyDiscount ?? 0,
    monthlyDiscount: b.monthlyDiscount ?? 0,
    extraGuestFee: b.extraGuestFee ?? 0,
    cleaningFee: b.cleaningFee ?? 0,
    serviceFeePercent: b.serviceFeePercent ?? 14,
    taxPercent: b.taxPercent ?? 0,
    minNights: b.minNights ?? 1,
    maxNights: b.maxNights ?? null,
    published: b.published ?? true,
    host: b.host,
    type: b.type,
    lat,
    lng,
  };
}
