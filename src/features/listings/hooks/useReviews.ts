import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';

export interface SubRatings {
  cleanliness: number;
  accuracy: number;
  checkin: number;
  communication: number;
  location: number;
  value: number;
}

export interface Review {
  id: string;
  rating: number;
  cleanliness: number;
  accuracy: number;
  checkin: number;
  communication: number;
  location: number;
  value: number;
  comment: string;
  response?: string | null;
  createdAt: string;
  userId: string;
  user: { id: string; name: string; avatar?: string | null };
}

export function useReviews(listingId: string | undefined) {
  return useQuery<Review[]>({
    queryKey: ['reviews', listingId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Review[] }>(`/listings/${listingId}/reviews?limit=20`);
      return data.data;
    },
    enabled: !!listingId,
  });
}

export function useCreateReview(listingId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; comment: string } & Partial<SubRatings>) =>
      api.post<Review>(`/listings/${listingId}/reviews`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
    },
  });
}

export function useRespondToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, response }: { reviewId: string; response: string }) =>
      api.patch<Review>(`/reviews/${reviewId}/respond`, { response }),
    onSuccess: (_data, { reviewId }) => {
      void reviewId;
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
