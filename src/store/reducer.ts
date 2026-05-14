import { produce, type Draft } from 'immer';
import type { State, Action } from './types';

const SAVED_KEY = 'liston:saved';

function loadSaved(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function persistSaved(ids: string[]): void {
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}

export const initialState: State = {
  listings: [],
  loading: true,
  filter: '',
  saved: loadSaved(),
};

export function reducer(state: State, action: Action): State {
  return produce(state, (draft: Draft<State>) => {
    switch (action.type) {
      case 'SET_LISTINGS':
        draft.listings = action.payload;
        break;
      case 'SET_LOADING':
        draft.loading = action.payload;
        break;
      case 'SET_FILTER':
        draft.filter = action.payload;
        break;
      case 'TOGGLE_FAVORITE': {
        const idx = draft.saved.indexOf(action.payload);
        if (idx !== -1) {
          draft.saved.splice(idx, 1);
        } else {
          draft.saved.push(action.payload);
        }
        persistSaved([...draft.saved]);
        break;
      }
      case 'RESET':
        draft.filter = '';
        draft.saved = [];
        persistSaved([]);
        break;
    }
  });
}
