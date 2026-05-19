import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import type { CancellationPolicy, ListingType } from '../types';
import { config } from '../../../config/env';

export interface CreateListingPayload {
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: ListingType;
  amenities: string[];
  rooms?: number;
  beds?: number;
  bathrooms?: number;
  photos?: string[];
  houseRules?: string;
  checkInMethod?: string;
  checkOutMethod?: string;
  instantBook?: boolean;
  cancellationPolicy?: CancellationPolicy;
  weekendPrice?: number | null;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  extraGuestFee?: number;
  cleaningFee?: number;
  serviceFeePercent?: number;
  taxPercent?: number;
  minNights?: number;
  maxNights?: number | null;
  published?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface HostListing {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  type: ListingType;
  rating: number | null;
  published: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  instantBook: boolean;
  cleaningFee: number;
  minNights: number;
  createdAt: string;
  photos?: string[];
  _count?: { bookings: number };
  latitude?: number | null;
  longitude?: number | null;
  // optional enriched fields for edit form
  description?: string;
  guests?: number;
  amenities?: string[];
  rooms?: number;
  beds?: number;
  bathrooms?: number;
  houseRules?: string | null;
  checkInMethod?: string | null;
  checkOutMethod?: string | null;
  cancellationPolicy?: CancellationPolicy;
  weekendPrice?: number | null;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  extraGuestFee?: number;
  serviceFeePercent?: number;
  taxPercent?: number;
  maxNights?: number | null;
}

export function useHostListings(userId?: string) {
  return useQuery<HostListing[]>({
    queryKey: ['host-listings', userId],
    queryFn: async () => {
      const { data } = await api.get<HostListing[]>('/listings/host/mine');
      return data;
    },
    enabled: !!config.apiUrl,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  });
}

export function useCreateListing(_userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateListingPayload) =>
      api.post<HostListing>('/listings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<CreateListingPayload> & { id: string }) =>
      api.patch<HostListing>(`/listings/${id}`, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// FR-032: Wishlist
export function useWishlist() {
  return useQuery<{ id: string; listing: { id: string; title: string; location: string } }[]>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get('/listings/wishlist');
      return data;
    },
    enabled: !!config.apiUrl,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) =>
      api.post<{ saved: boolean }>(`/listings/wishlist/${listingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}
