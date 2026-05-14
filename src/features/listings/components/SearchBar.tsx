import { useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useStore } from '../../../store/StoreContext';
import { FaUser, FaChevronDown, FaCrosshairs, FaMapMarkerAlt, FaSlidersH, FaTimes } from 'react-icons/fa';

const DISTANCES = ['0.5 km', '1 km', '5 km', '10 km', '25 km', '50 km'];

export interface SearchBarProps {
  allLocations: string[];
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  categories: Array<{ value: string; label: string; count: number }>;
  selectedCategories: string[];
  onCategoryChange: (cats: string[]) => void;
}

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return { open, setOpen, ref };
}

export default function SearchBar({
  allLocations,
  selectedLocation,
  onLocationChange,
  categories,
  selectedCategories,
  onCategoryChange,
}: SearchBarProps) {
  const { dispatch } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState('');

  const distDropdown = useDropdown();
  const locDropdown = useDropdown();
  const catDropdown = useDropdown();

  const [distance, setDistance] = useState('0.5 km');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const debouncedDispatch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch({ type: 'SET_FILTER', payload: value });
      }, 300),
    [dispatch]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalValue(e.target.value);
    debouncedDispatch(e.target.value);
  }

  function handleLocationSelect(loc: string) {
    onLocationChange(loc === selectedLocation ? '' : loc);
    locDropdown.setOpen(false);
  }

  function handleCategorySelect(value: string) {
    if (selectedCategories.includes(value)) {
      onCategoryChange(selectedCategories.filter((c) => c !== value));
    } else {
      onCategoryChange([value]);
    }
    catDropdown.setOpen(false);
  }

  const activeCategoryLabel = selectedCategories.length === 1
    ? categories.find((c) => c.value === selectedCategories[0])?.label
    : null;

  return (
    <div className="search-row">
      {/* Text search */}
      <label className="search-section search-section--text">
        <FaUser className="search-section__icon" />
        <input
          ref={inputRef}
          className="search-section__input"
          type="text"
          placeholder="What are you looking for?"
          value={localValue}
          onChange={handleChange}
        />
        {localValue && (
          <button
            className="search-clear-btn"
            onClick={() => { setLocalValue(''); dispatch({ type: 'SET_FILTER', payload: '' }); }}
            aria-label="Clear search"
          >
            <FaTimes />
          </button>
        )}
      </label>

      <div className="search-sep" />

      {/* Distance */}
      <div className="search-section search-section--distance" ref={distDropdown.ref}>
        <div
          className="search-distance-control"
          onClick={() => distDropdown.setOpen((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && distDropdown.setOpen((v) => !v)}
        >
          <span className="search-distance-value">{distance}</span>
          <FaChevronDown className={`search-section__chevron${distDropdown.open ? ' search-section__chevron--open' : ''}`} />
        </div>
        {distDropdown.open && (
          <div className="search-dropdown">
            {DISTANCES.map((d) => (
              <button
                key={d}
                className={`search-dropdown-option${d === distance ? ' search-dropdown-option--active' : ''}`}
                onClick={() => { setDistance(d); distDropdown.setOpen(false); }}
              >
                {d}
              </button>
            ))}
          </div>
        )}
        <button className="search-gps-btn" aria-label="Use GPS location">
          <FaCrosshairs />
        </button>
      </div>

      <div className="search-sep" />

      {/* Location */}
      <div
        className={`search-section search-section--location${selectedLocation ? ' search-section--active' : ''}`}
        ref={locDropdown.ref}
        onClick={() => locDropdown.setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && locDropdown.setOpen((v) => !v)}
      >
        <FaMapMarkerAlt className={`search-section__icon${selectedLocation ? ' search-section__icon--active' : ''}`} />
        <span className={selectedLocation ? 'search-section__value' : 'search-section__placeholder'}>
          {selectedLocation || 'Select Location'}
        </span>
        {selectedLocation ? (
          <button
            className="search-inline-clear"
            onClick={(e) => { e.stopPropagation(); onLocationChange(''); locDropdown.setOpen(false); }}
            aria-label="Clear location"
          >
            <FaTimes />
          </button>
        ) : (
          <FaChevronDown className={`search-section__chevron search-section__chevron--end${locDropdown.open ? ' search-section__chevron--open' : ''}`} />
        )}
        {locDropdown.open && (
          <div className="search-dropdown search-dropdown--location">
            <button
              className={`search-dropdown-option${!selectedLocation ? ' search-dropdown-option--active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleLocationSelect(''); }}
            >
              All Locations
            </button>
            {allLocations.map((loc) => (
              <button
                key={loc}
                className={`search-dropdown-option${loc === selectedLocation ? ' search-dropdown-option--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleLocationSelect(loc); }}
              >
                {loc}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="search-sep" />

      {/* Category */}
      <div
        className={`search-section search-section--category${activeCategoryLabel ? ' search-section--active' : ''}`}
        ref={catDropdown.ref}
        onClick={() => catDropdown.setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && catDropdown.setOpen((v) => !v)}
      >
        <FaSlidersH className={`search-section__icon${activeCategoryLabel ? ' search-section__icon--active' : ''}`} />
        <span className={activeCategoryLabel ? 'search-section__value' : 'search-section__placeholder'}>
          {activeCategoryLabel ?? 'All Categories'}
        </span>
        {activeCategoryLabel ? (
          <button
            className="search-inline-clear"
            onClick={(e) => { e.stopPropagation(); onCategoryChange([]); catDropdown.setOpen(false); }}
            aria-label="Clear category"
          >
            <FaTimes />
          </button>
        ) : (
          <FaChevronDown className={`search-section__chevron search-section__chevron--end${catDropdown.open ? ' search-section__chevron--open' : ''}`} />
        )}
        {catDropdown.open && (
          <div className="search-dropdown search-dropdown--category">
            <button
              className={`search-dropdown-option${selectedCategories.length === 0 ? ' search-dropdown-option--active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onCategoryChange([]); catDropdown.setOpen(false); }}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                className={`search-dropdown-option${selectedCategories.includes(cat.value) ? ' search-dropdown-option--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleCategorySelect(cat.value); }}
              >
                <span>{cat.label}</span>
                <span className="search-dropdown-count">({cat.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
