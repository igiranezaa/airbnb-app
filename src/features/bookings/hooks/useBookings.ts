import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { useAuth } from '../../auth/hooks/useAuth';

export interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  guestId: string;
  listingId: string;
  createdAt: string;
  guest: { name: string; email: string };
  listing: { title: string; location: string; hostId: string };
  rejectionReason?: string;
  refundAmount?: number;
}

type BookingView = 'auto' | 'guest' | 'host';

export function useBookings(view: BookingView = 'auto') {
  const { userRole, userId } = useAuth();
  return useQuery<Booking[]>({
    queryKey: ['bookings', userRole || 'GUEST', userId, view],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (view !== 'auto') params.set('view', view);
      const { data } = await api.get<{ data: Booking[] }>(`/bookings?${params.toString()}`);
      return data.data;
    },
    enabled: !!import.meta.env.VITE_API_URL,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: userRole === 'HOST' || view === 'host' ? 15_000 : false,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['host-listings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['listings'], exact: false });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: 'CONFIRMED' | 'CANCELLED'; rejectionReason?: string }) =>
      api.patch(`/bookings/${id}/status`, { status, ...(rejectionReason ? { rejectionReason } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['host-listings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['listings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });
}
