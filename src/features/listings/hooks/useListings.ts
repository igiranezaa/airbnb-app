import { useEffect } from 'react';
import { useStore } from '../../../store/StoreContext';
import listings from '../../../data/listings';

export function useListings(): void {
  const { state, dispatch } = useStore();

  useEffect(() => {
    if (state.listings.length > 0) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_LISTINGS', payload: listings });
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 1500);
    return () => clearTimeout(timer);
  }, [dispatch, state.listings.length]);
}
