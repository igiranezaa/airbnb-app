import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../../../store/StoreContext';

export function useFavorites() {
  const { state, dispatch } = useStore();

  const toggle = useCallback((id: string, title: string) => {
    const adding = !state.saved.includes(id);
    dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
    toast(adding ? `Saved: ${title}` : `Removed: ${title}`);
  }, [dispatch, state.saved]);

  const isSaved = useCallback((id: string): boolean => {
    return state.saved.includes(id);
  }, [state.saved]);

  return { toggle, count: state.saved.length, isSaved };
}
