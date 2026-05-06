import { useStore } from '../../../store/StoreContext';

export default function SavedBadge() {
  const { state } = useStore();
  const count = state.saved.length;

  if (count === 0) return null;

  return (
    <span className="saved-badge">
      {count} {count === 1 ? 'saved' : 'saved'}
    </span>
  );
}
