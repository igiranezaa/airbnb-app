/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, type Dispatch, type ReactNode, type ReactElement } from 'react';
import { reducer, initialState } from './reducer';
import { useLocalStorage } from '../shared/hooks/useLocalStorage';
import type { State, Action } from './types';

interface StoreContextValue {
  state: State;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }): ReactElement {
  const [savedIds] = useLocalStorage<string[]>('liston:saved', []);
  const [state, dispatch] = useReducer(reducer, { ...initialState, saved: savedIds });
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
