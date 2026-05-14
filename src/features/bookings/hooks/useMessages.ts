import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { config } from '../../../config/env';

export interface ApiMessage {
  id: string;
  content: string;
  imageUrl?: string | null;
  bookingId?: string | null;
  listingId?: string | null;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

export function useMessages(bookingId?: string, listingId?: string) {
  const key = bookingId ?? listingId;
  return useQuery<ApiMessage[]>({
    queryKey: ['messages', key],
    queryFn: async () => {
      const param = bookingId ? `bookingId=${bookingId}` : `listingId=${listingId}`;
      const { data } = await api.get<ApiMessage[]>(`/messages?${param}`);
      return data;
    },
    enabled: !!(bookingId || listingId) && !!config.apiUrl,
    refetchInterval: 4000,
  });
}

export function useSendMessage(bookingId?: string, listingId?: string) {
  const key = bookingId ?? listingId;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, imageUrl }: { content: string; imageUrl?: string }) =>
      api.post<ApiMessage>('/messages', { bookingId, listingId, content, imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', key] });
    },
  });
}
