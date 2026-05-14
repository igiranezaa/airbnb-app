import type { State, Action } from './types';

const SAVED_KEY = 'liston:saved';

function loadSaved(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSaved(ids: string[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}

export const initialState: State = {
  listings: [],
  loading: true,
  filter: '',
  saved: loadSaved(),
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LISTINGS':
      return { ...state, listings: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'TOGGLE_FAVORITE': {
      const next = state.saved.includes(action.payload)
        ? state.saved.filter((id) => id !== action.payload)
        : [...state.saved, action.payload];
      persistSaved(next);
      return { ...state, saved: next };
    }
    case 'RESET':
      persistSaved([]);
      return { ...state, filter: '', saved: [] };
  }
}
