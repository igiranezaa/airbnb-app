import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/axios';
import mockListings from '../../../data/listings';
import { transformListing, type BackendListing, type PaginatedResponse } from '../utils/transform';
import type { Listing } from '../types';
import { config } from '../../../config/env';

export interface ListingSearchParams {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  instantBook?: boolean;
  superhost?: boolean;
  minRooms?: number;
  minBathrooms?: number;
}

function hasActiveSearchParams(params?: ListingSearchParams): boolean {
  if (!params) return false;
  return Object.values(params).some((value) => Array.isArray(value) ? value.length > 0 : value != null && value !== false && value !== '');
}

export function useListings(params?: ListingSearchParams) {
  const hasActiveParams = hasActiveSearchParams(params);

  return useQuery<Listing[]>({
    queryKey: ['listings', hasActiveParams ? params : undefined],
    queryFn: async () => {
      if (!config.apiUrl) {
        await new Promise((r) => setTimeout(r, 600));
        return mockListings;
      }
      const q = new URLSearchParams();
      if (params?.location) q.set('location', params.location);
      if (params?.checkIn) q.set('checkIn', params.checkIn);
      if (params?.checkOut) q.set('checkOut', params.checkOut);
      if (params?.guests != null) q.set('guests', String(params.guests));
      if (params?.type) q.set('type', params.type);
      if (params?.minPrice != null) q.set('minPrice', String(params.minPrice));
      if (params?.maxPrice != null) q.set('maxPrice', String(params.maxPrice));
      if (params?.amenities?.length) q.set('amenities', params.amenities.join(','));
      if (params?.instantBook) q.set('instantBook', 'true');
      if (params?.superhost) q.set('superhost', 'true');
      if (params?.minRooms) q.set('minRooms', String(params.minRooms));
      if (params?.minBathrooms) q.set('minBathrooms', String(params.minBathrooms));
      q.set('limit', '100');
      try {
        const { data } = await api.get<PaginatedResponse<BackendListing>>(`/listings/search?${q.toString()}`);
        return data.data.map(transformListing);
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });
}
