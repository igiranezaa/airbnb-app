export type CancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'NON_REFUNDABLE' | 'LONG_TERM';
export type ListingType = 'APARTMENT' | 'HOUSE' | 'VILLA' | 'CABIN';
export type ListingCategory = 'beach' | 'mountain' | 'city' | 'countryside';

export interface Listing {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  superhost: boolean;
  available: boolean;
  availableFrom: string;
  img: string;
  photos: string[];
  category: ListingCategory;
  // Room details (FR-014)
  rooms: number;
  beds: number;
  bathrooms: number;
  guests: number;
  amenities: string[];
  houseRules: string | null;
  checkInMethod: string | null;
  checkOutMethod: string | null;
  // Booking behavior (FR-033)
  instantBook: boolean;
  cancellationPolicy: CancellationPolicy;
  // Pricing (FR-016, FR-030)
  weekendPrice: number | null;
  weeklyDiscount: number;
  monthlyDiscount: number;
  extraGuestFee: number;
  cleaningFee: number;
  serviceFeePercent: number;
  taxPercent: number;
  // Availability (FR-018)
  minNights: number;
  maxNights: number | null;
  // Publishing (FR-021)
  published: boolean;
  // Host
  host?: { id: string; name: string; avatar?: string | null };
  type: ListingType;
  // Map coordinates
  lat?: number;
  lng?: number;
}

export interface BlockedDate {
  id: string;
  date: string;
}

export interface BookingBreakdown {
  nightlyTotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  totalPrice: number;
}
