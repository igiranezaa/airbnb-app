import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { useStore } from '../../../store/StoreContext';

export function useToggleSaved(listingId: string) {
  const queryClient = useQueryClient();
  const { state, dispatch } = useStore();

  const savedIds: string[] =
    queryClient.getQueryData<string[]>(['saved']) ?? state.saved;
  const isSaved = savedIds.includes(listingId);

  const mutation = useMutation({
    mutationFn: () => api.post(`/saved/${listingId}`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['saved'] });
      const previous =
        queryClient.getQueryData<string[]>(['saved']) ?? state.saved;
      queryClient.setQueryData<string[]>(['saved'], (old = []) =>
        old.includes(listingId)
          ? old.filter((i) => i !== listingId)
          : [...old, listingId]
      );
      dispatch({ type: 'TOGGLE_FAVORITE', payload: listingId });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['saved'], context.previous);
      }
      dispatch({ type: 'TOGGLE_FAVORITE', payload: listingId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });

  const toggle = (title: string) => {
    toast(isSaved ? `Removed: ${title}` : `Saved: ${title}`);
    mutation.mutate();
  };

  return { isSaved, toggle, isPending: mutation.isPending };
}
