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

export function transformListing(b: BackendListing): Listing {
  const category = TYPE_TO_CATEGORY[b.type] ?? 'city';
  const firstPhoto = b.photos?.[0];
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
    lat: b.latitude ?? undefined,
    lng: b.longitude ?? undefined,
  };
}
