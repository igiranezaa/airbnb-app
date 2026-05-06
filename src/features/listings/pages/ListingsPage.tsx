import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { List as FixedSizeList, type RowComponentProps } from 'react-window';
import { useStore } from '../../../store/StoreContext';
import { useListings } from '../hooks/useListings';
import { useFavorites } from '../hooks/useFavorites';
import type { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import SearchBar from '../components/SearchBar';
import SavedBadge from '../components/SavedBadge';
import SavedListings from '../components/SavedListings';
import Spinner from '../../../shared/components/Spinner';
import './ListingsPage.css';

const CARD_GAP = 24;
const ROW_HEIGHT = 438;

interface ListingRowProps {
  rows: Listing[][];
  columnWidth: number;
  isSaved: (id: number) => boolean;
  onToggleSave: (id: number, title: string) => void;
}

function ListingRow({
  index,
  style,
  ariaAttributes,
  rows,
  columnWidth,
  isSaved,
  onToggleSave,
}: RowComponentProps<ListingRowProps>) {
  const rowItems = rows[index];

  return (
    <div
      {...ariaAttributes}
      style={{ ...style, display: 'flex', gap: CARD_GAP, paddingBottom: CARD_GAP }}
    >
      {rowItems.map((listing) => (
        <div key={listing.id} style={{ width: columnWidth, flexShrink: 0 }}>
          <ListingCard
            listing={listing}
            saved={isSaved(listing.id)}
            onToggleSave={onToggleSave}
          />
        </div>
      ))}
    </div>
  );
}

export default function ListingsPage() {
  useListings();

  const { state, dispatch } = useStore();
  const { toggle, isSaved } = useFavorites();
  const [showSaved, setShowSaved] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? Math.min(window.innerWidth - 64, 1200) : 800
  );
  const columnCount = containerWidth < 600 ? 1 : containerWidth < 960 ? 2 : 3;

  const filtered = useMemo(() => {
    const q = state.filter.toLowerCase();
    return state.listings.filter((l) => {
      if (savedOnly && !state.saved.includes(l.id)) return false;
      return l.title.toLowerCase().includes(q) || l.location.toLowerCase().includes(q);
    });
  }, [state.listings, state.filter, savedOnly, state.saved]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => setContainerWidth(Math.floor(el.clientWidth));
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state.loading, filtered.length]);

  const rows = useMemo(() => {
    const result: (typeof filtered)[] = [];
    for (let i = 0; i < filtered.length; i += columnCount) {
      result.push(filtered.slice(i, i + columnCount));
    }
    return result;
  }, [filtered, columnCount]);

  const handleToggleSave = useCallback(
    (id: number, title: string) => toggle(id, title),
    [toggle]
  );

  const handleReset = useCallback(
    () => dispatch({ type: 'RESET' }),
    [dispatch]
  );

  const colWidth = containerWidth > 0
    ? Math.floor((containerWidth - (columnCount - 1) * CARD_GAP) / columnCount)
    : 280;

  const listHeight = useMemo(
    () => Math.min(rows.length * ROW_HEIGHT, typeof window !== 'undefined' ? window.innerHeight - 220 : 600),
    [rows.length]
  );

  const rowProps = useMemo(
    () => ({
      rows,
      columnWidth: colWidth,
      isSaved,
      onToggleSave: handleToggleSave,
    }),
    [rows, colWidth, isSaved, handleToggleSave]
  );

  return (
    <div className="listings-page">
      <header className="listings-header">
        <SearchBar />
        <div className="listings-actions">
          <SavedBadge />
          <button className="saved-only-toggle" onClick={() => setSavedOnly((v) => !v)}>
            {savedOnly ? 'Show All' : 'Saved Only'}
          </button>
          <button className="saved-toggle" onClick={() => setShowSaved((v) => !v)}>
            {showSaved ? 'Hide Saved' : 'View Saved'}
          </button>
          <button className="reset-btn" onClick={handleReset}>
            Clear All
          </button>
        </div>
        {!state.loading && (
          <p className="listings-count">
            All <strong>{filtered.length.toLocaleString()}</strong> listings found
          </p>
        )}
      </header>

      {state.loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="listings-empty">
          <p>No listings match your search.</p>
        </div>
      ) : (
        <div ref={containerRef} className="listings-virtual-container">
          <FixedSizeList
            rowComponent={ListingRow}
            rowCount={rows.length}
            rowHeight={ROW_HEIGHT}
            rowProps={rowProps}
            style={{ height: listHeight, width: containerWidth }}
          />
        </div>
      )}

      <SavedListings open={showSaved} onClose={() => setShowSaved(false)} />
    </div>
  );
}
