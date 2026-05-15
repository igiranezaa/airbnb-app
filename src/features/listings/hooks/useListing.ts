import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/axios';
import mockListings from '../../../data/listings';
import { transformListing, type BackendListing } from '../utils/transform';
import type { Listing } from '../types';
import { config } from '../../../config/env';

export function useListing(id: string | undefined) {
  return useQuery<Listing>({
    queryKey: ['listing', id],
    queryFn: async () => {
      if (!config.apiUrl) {
        await new Promise((r) => setTimeout(r, 300));
        const listing = mockListings.find((l) => String(l.id) === id);
        if (!listing) throw new Error(`Listing ${id} not found`);
        return listing;
      }
      try {
        const { data } = await api.get<BackendListing & { reviewCount?: number }>(`/listings/${id}`);
        return transformListing(data);
      } catch (error) {
        const listing = mockListings.find((l) => String(l.id) === id);
        if (listing) return listing;
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}
