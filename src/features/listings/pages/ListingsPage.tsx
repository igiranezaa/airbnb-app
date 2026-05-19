import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { List as FixedSizeList, type RowComponentProps } from 'react-window';
import { FaTh, FaList, FaTimes, FaFilter, FaMap, FaMapMarkerAlt } from 'react-icons/fa';
import { useStore } from '../../../store/StoreContext';
import { useListings, type ListingSearchParams } from '../hooks/useListings';
import { useFavorites } from '../hooks/useFavorites';
import type { Listing } from '../types';
import { Card } from '../components/Card';
import SearchBar from '../components/SearchBar';
import Spinner from '../../../shared/components/Spinner';
import ListingsMap from '../components/ListingsMap';
import './ListingsPage.css';

const CARD_GAP = 24;
const GRID_ROW_HEIGHT = 438;
const LIST_ROW_HEIGHT = 180;
const PRICE_MIN = 0;
const PRICE_MAX = 1000;

type ViewMode = 'grid' | 'list';
type SortBy = 'latest' | 'price-asc' | 'price-desc' | 'rating';

const CATEGORY_LABELS: Record<string, string> = {
  beach: 'Beach',
  mountain: 'Mountain',
  city: 'City',
  countryside: 'Countryside',
};

const AMENITY_FILTERS = ['WiFi', 'Pool', 'Kitchen', 'Parking', 'Pet friendly', 'EV charger'];

interface SidebarFilters {
  minPrice: number;
  maxPrice: number;
  categories: string[];
  amenities: string[];
  instantBook: boolean;
  superhost: boolean;
  minRooms: number;
  sortBy: SortBy;
}

const DEFAULT_FILTERS: SidebarFilters = {
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  categories: [],
  amenities: [],
  instantBook: false,
  superhost: false,
  minRooms: 0,
  sortBy: 'latest',
};

interface ListingRowProps {
  rows: Listing[][];
  columnWidth: number;
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string, title: string) => void;
  listMode: boolean;
  hoveredId: string | null;
  onHoverListing: (id: string | null) => void;
  onOpenListing: (listing: Listing) => void;
}

function ListingRow({
  index, style, ariaAttributes,
  rows, columnWidth, isSaved, onToggleSave, listMode, hoveredId, onHoverListing, onOpenListing,
}: RowComponentProps<ListingRowProps>) {
  const rowItems = rows[index];
  return (
    <div
      {...ariaAttributes}
      className={`listings-row${listMode ? ' listings-row--list' : ' listings-row--grid'}`}
      style={{ ...style, display: 'flex', gap: CARD_GAP, paddingBottom: CARD_GAP }}
    >
      {rowItems.map((listing) => (
        <div
          key={listing.id}
          className="listings-row__item"
          style={{
            width: listMode ? '100%' : columnWidth,
            height: listMode ? LIST_ROW_HEIGHT - CARD_GAP : GRID_ROW_HEIGHT - CARD_GAP,
            flexShrink: 0,
            outline: listing.id === hoveredId ? '2px solid #ef4f38' : 'none',
            borderRadius: 8,
            transition: 'outline 0.15s',
          }}
          onMouseEnter={() => onHoverListing(listing.id)}
          onMouseLeave={() => onHoverListing(null)}
        >
          <Card
            listing={listing}
            saved={isSaved(listing.id)}
            onToggleSave={onToggleSave}
            className={`card${listMode ? ' card--list' : ''}`}
            onClick={() => onOpenListing(listing)}
          >
            <Card.Image />
            <div className="card__body">
              <Card.Badge />
              <Card.Title />
              <Card.Location />
              <div className="card__footer-row">
                <Card.Price />
                <Card.Rating />
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

function PriceRangeSlider({ minVal, maxVal, onChange }: {
  minVal: number; maxVal: number; onChange: (min: number, max: number) => void;
}) {
  const leftPct = ((minVal - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const rightPct = 100 - ((maxVal - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  return (
    <div className="price-slider-wrap">
      <div className="price-slider-track">
        <div className="price-slider-fill" style={{ left: `${leftPct}%`, right: `${rightPct}%` }} />
      </div>
      <input type="range" className="price-slider price-slider--min" min={PRICE_MIN} max={PRICE_MAX} value={minVal}
        onChange={(e) => onChange(Math.min(Number(e.target.value), maxVal - 10), maxVal)} />
      <input type="range" className="price-slider price-slider--max" min={PRICE_MIN} max={PRICE_MAX} value={maxVal}
        onChange={(e) => onChange(minVal, Math.max(Number(e.target.value), minVal + 10))} />
    </div>
  );
}

export default function ListingsPage() {
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();

  /* ── Search bar state (applied immediately) ── */
  const [checkIn, setCheckIn] = useState(() => urlParams.get('checkIn') ?? '');
  const [checkOut, setCheckOut] = useState(() => urlParams.get('checkOut') ?? '');
  const [guestCount, setGuestCount] = useState(() => Number(urlParams.get('guests') ?? 1));
  const [selectedLocation, setSelectedLocation] = useState(() => urlParams.get('location') ?? '');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);

  /* ── Draft sidebar filters (shown in UI, not yet applied) ── */
  const [draft, setDraft] = useState<SidebarFilters>(DEFAULT_FILTERS);

  /* ── Applied sidebar filters (used for actual filtering) ── */
  const [applied, setApplied] = useState<SidebarFilters>(DEFAULT_FILTERS);

  const patch = useCallback(<K extends keyof SidebarFilters>(key: K, value: SidebarFilters[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  function applyFilters() {
    setApplied({ ...draft });
  }

  function clearAll() {
    setCheckIn(''); setCheckOut(''); setGuestCount(1);
    setSelectedLocation(''); setSelectedType('');
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
  }

  const searchParams = useMemo<ListingSearchParams>(() => ({
    location: selectedLocation || undefined,
    checkIn: checkIn || undefined,
    checkOut: checkOut || undefined,
    guests: guestCount > 1 ? guestCount : undefined,
    type: selectedType || undefined,
    amenities: applied.amenities.length ? applied.amenities : undefined,
    instantBook: applied.instantBook || undefined,
    superhost: applied.superhost || undefined,
    minRooms: applied.minRooms > 0 ? applied.minRooms : undefined,
  }), [selectedLocation, checkIn, checkOut, guestCount, selectedType, applied]);

  const { data: listings = [], isLoading, isError, refetch } = useListings(searchParams);
  const { state } = useStore();
  const { toggle, isSaved } = useFavorites();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? Math.min(window.innerWidth - 400, 900) : 700
  );

  const columnCount = viewMode === 'list' ? 1 : containerWidth < 600 ? 1 : containerWidth < 900 ? 2 : 3;
  const rowHeight = viewMode === 'list' ? LIST_ROW_HEIGHT : GRID_ROW_HEIGHT;

  const categoryCounts = useMemo(
    () => listings.reduce<Record<string, number>>((acc, l) => { acc[l.category] = (acc[l.category] || 0) + 1; return acc; }, {}),
    [listings]
  );

  const allLocations = useMemo(() => [...new Set(listings.map((l) => l.location))].sort(), [listings]);

  const categoryOptions = useMemo(
    () => Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label, count: categoryCounts[value] || 0 })),
    [categoryCounts]
  );

  const filtered = useMemo(() => {
    const q = state.filter.toLowerCase();
    const results = listings.filter((l) => {
      if (l.price < applied.minPrice || l.price > applied.maxPrice) return false;
      if (applied.categories.length > 0 && !applied.categories.includes(l.category)) return false;
      return l.title.toLowerCase().includes(q) || l.location.toLowerCase().includes(q);
    });
    switch (applied.sortBy) {
      case 'price-asc':  return [...results].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...results].sort((a, b) => b.price - a.price);
      case 'rating':     return [...results].sort((a, b) => b.rating - a.rating);
      default: return results;
    }
  }, [listings, state.filter, applied]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(Math.floor(el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLoading, filtered.length]);

  const rows = useMemo(() => {
    const result: (typeof filtered)[] = [];
    for (let i = 0; i < filtered.length; i += columnCount) result.push(filtered.slice(i, i + columnCount));
    return result;
  }, [filtered, columnCount]);

  const handleToggleSave = useCallback((id: string, title: string) => toggle(id, title), [toggle]);
  const openListing = useCallback((listing: Listing) => {
    navigate(`/listings/${listing.id}`, { state: { listing } });
  }, [navigate]);

  const toggleCategory = useCallback((cat: string) => {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  }, []);

  const toggleAmenity = useCallback((a: string) => {
    setDraft((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  }, []);

  const colWidth = containerWidth > 0 ? Math.floor((containerWidth - (columnCount - 1) * CARD_GAP) / columnCount) : 280;
  const listHeight = useMemo(
    () => Math.min(rows.length * rowHeight, typeof window !== 'undefined' ? window.innerHeight - 260 : 600),
    [rows.length, rowHeight]
  );
  const rowProps = useMemo(
    () => ({
      rows,
      columnWidth: colWidth,
      isSaved,
      onToggleSave: handleToggleSave,
      listMode: viewMode === 'list',
      hoveredId,
      onHoverListing: setHoveredId,
      onOpenListing: openListing,
    }),
    [rows, colWidth, isSaved, handleToggleSave, viewMode, hoveredId, openListing]
  );

  const midPrice = Math.round((draft.minPrice + draft.maxPrice) / 2);
  const filterSidebarContent = (
    <>
      <section className="sidebar-section">
        <h3 className="sidebar-title">Price Range</h3>
        <p className="sidebar-desc">Select min and max price range</p>
        <div className="sidebar-price-labels">
          <span className="sidebar-price-tag">${draft.minPrice.toLocaleString()}</span>
          <span className="sidebar-price-tag">${midPrice.toLocaleString()}</span>
          <span className="sidebar-price-tag sidebar-price-tag--muted">${PRICE_MAX.toLocaleString()}</span>
        </div>
        <PriceRangeSlider
          minVal={draft.minPrice}
          maxVal={draft.maxPrice}
          onChange={(min, max) => setDraft((prev) => ({ ...prev, minPrice: min, maxPrice: max }))}
        />
      </section>
      <section className="sidebar-section">
        <h3 className="sidebar-title">Categories</h3>
        <ul className="sidebar-categories">
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => {
            const count = categoryCounts[value] || 0;
            const checked = draft.categories.includes(value);
            return (
              <li key={value} className="sidebar-category-item">
                <label className="sidebar-category-label">
                  <span className={`sidebar-category-checkbox${checked ? ' sidebar-category-checkbox--checked' : ''}`}
                    onClick={() => toggleCategory(value)} role="checkbox" aria-checked={checked} tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleCategory(value)}>
                    {checked && <svg viewBox="0 0 12 10" width="12" height="10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <span className="sidebar-category-name">{label}</span>
                  <span className="sidebar-category-count">({count})</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="sidebar-section">
        <h3 className="sidebar-title">Amenities</h3>
        <div className="sidebar-amenities">
          {AMENITY_FILTERS.map((a) => {
            const on = draft.amenities.includes(a);
            return (
              <label key={a} className="sidebar-amenity-label">
                <span className={`sidebar-category-checkbox${on ? ' sidebar-category-checkbox--checked' : ''}`}
                  onClick={() => toggleAmenity(a)} role="checkbox" aria-checked={on} tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleAmenity(a)}>
                  {on && <svg viewBox="0 0 12 10" width="12" height="10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                <span className="sidebar-category-name">{a}</span>
              </label>
            );
          })}
        </div>
      </section>
      <section className="sidebar-section">
        <h3 className="sidebar-title">Filter by</h3>
        <div className="sidebar-toggles">
          <label className="sidebar-toggle-row">
            <input type="checkbox" checked={draft.instantBook} onChange={(e) => patch('instantBook', e.target.checked)} />
            <span>Instant Book only</span>
          </label>
          <label className="sidebar-toggle-row">
            <input type="checkbox" checked={draft.superhost} onChange={(e) => patch('superhost', e.target.checked)} />
            <span>Superhost only</span>
          </label>
        </div>
        <div className="sidebar-rooms-row">
          <label className="sidebar-desc">Min bedrooms</label>
          <select className="sidebar-select sidebar-select--sm" value={draft.minRooms}
            onChange={(e) => patch('minRooms', Number(e.target.value))}>
            <option value={0}>Any</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
          </select>
        </div>
      </section>
      <section className="sidebar-section">
        <h3 className="sidebar-title">Order by</h3>
        <select className="sidebar-select" value={draft.sortBy} onChange={(e) => patch('sortBy', e.target.value as SortBy)}>
          <option value="latest">Latest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </section>
      <button className="sidebar-apply-btn" type="button" onClick={() => { applyFilters(); setShowFilters(false); }}>
        Apply filters
      </button>
      <button className="sidebar-clear-btn" type="button" onClick={clearAll}>↺ Clear all</button>
    </>
  );

  return (
    <div className="listings-page">
      {/* Search bar */}
      <div className="listings-search-wrapper">
        <SearchBar
          allLocations={allLocations}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          categories={categoryOptions}
          selectedCategories={draft.categories}
          onCategoryChange={(cats) => patch('categories', cats)}
        />
      </div>

      {/* Body: listings + map */}
      <div className="listings-body">
        {/* ── Left panel ── */}
        <div className="listings-panel">
          <div className="listings-toolbar">
            {!isLoading && !isError && (
              <p className="listings-count">
                <strong>{filtered.length.toLocaleString()}</strong> home{filtered.length !== 1 ? 's' : ''}
                {selectedLocation ? ` in ${selectedLocation}` : ' available'}
              </p>
            )}
            <div className="listings-toolbar__actions">
              <button className="listings-filter-btn" onClick={() => setShowFilters(true)}>
                <FaFilter /> Filters
              </button>
              <div className="listings-view-toggle">
                <button className={`view-btn${viewMode === 'grid' ? ' view-btn--active' : ''}`} onClick={() => setViewMode('grid')} aria-label="Grid view"><FaTh /></button>
                <button className={`view-btn${viewMode === 'list' ? ' view-btn--active' : ''}`} onClick={() => setViewMode('list')} aria-label="List view"><FaList /></button>
              </div>
              <button className={`listings-map-toggle${showMap ? ' listings-map-toggle--active' : ''}`} onClick={() => setShowMap((v) => !v)}>
                {showMap ? <FaMapMarkerAlt /> : <FaMap />} {showMap ? 'Hide map' : 'Show map'}
              </button>
            </div>
          </div>

          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <div className="listings-error">
              <p>Failed to load listings.</p>
              <button className="listings-retry-btn" onClick={() => refetch()}>Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="listings-empty">
              <p>No listings match your search.</p>
              <button className="listings-retry-btn" onClick={clearAll}>Clear filters</button>
            </div>
          ) : (
            <div ref={containerRef} className="listings-virtual-container">
              <FixedSizeList
                rowComponent={ListingRow}
                rowCount={rows.length}
                rowHeight={rowHeight}
                rowProps={rowProps}
                style={{ height: listHeight, width: containerWidth }}
              />
            </div>
          )}
        </div>

        {/* ── Map panel ── */}
        {showMap && (
          <div className="listings-map-panel">
            <ListingsMap
              listings={filtered}
              hoveredId={hoveredId}
              onHover={setHoveredId}
            />
          </div>
        )}
      </div>

      {/* ── Filter drawer ── */}
      {showFilters && (
        <div className="listings-filter-overlay" onClick={() => setShowFilters(false)}>
          <aside className="listings-filter-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="listings-filter-drawer__head">
              <h3 className="listings-filter-drawer__title">Filters</h3>
              <button className="listings-filter-drawer__close" onClick={() => setShowFilters(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="listings-filter-drawer__body">
              {filterSidebarContent}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
