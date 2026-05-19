import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { FaHeart, FaRegHeart, FaStar, FaMapMarkerAlt, FaCheckCircle, FaPhone, FaTh, FaList } from 'react-icons/fa';
import { MdFilterList } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import numeral from 'numeral';
import { useListings } from '../hooks/useListings';
import { useFavorites } from '../hooks/useFavorites';
import SearchBar from '../components/SearchBar';
import Spinner from '../../../shared/components/Spinner';
import type { Listing } from '../types';
import { getFallbackPhoto } from '../utils/photos';
import './ExplorePage.css';

// Fix Leaflet's broken default icon paths when bundled with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_COLORS: Record<string, string> = {
  beach: '#f97316',
  mountain: '#3b82f6',
  city: '#8b5cf6',
  countryside: '#22c55e',
};

const CATEGORY_LABELS: Record<string, string> = {
  beach: 'Beach',
  mountain: 'Mountain',
  city: 'City',
  countryside: 'Countryside',
};

function makeIcon(category: string) {
  const color = CATEGORY_COLORS[category] ?? '#f97316';
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
      <path fill="${color}" stroke="#fff" stroke-width="2"
        d="M14 0C6.27 0 0 6.27 0 14c0 9.63 14 24 14 24S28 23.63 28 14C28 6.27 21.73 0 14 0z"/>
      <circle fill="#fff" cx="14" cy="14" r="5"/>
    </svg>`);
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -40],
  });
}

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  const withCoords = listings.filter((l) => l.lat != null && l.lng != null);
  useMemo(() => {
    if (!withCoords.length) return;
    const bounds = L.latLngBounds(withCoords.map((l) => [l.lat!, l.lng!]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 5 });
  }, [withCoords.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ExploreCard({
  listing, saved, onToggleSave, active, onHover,
}: {
  listing: Listing;
  saved: boolean;
  onToggleSave: (id: string, title: string) => void;
  active: boolean;
  onHover: (id: string | null) => void;
}) {
  const navigate = useNavigate();
  const reviewCount = Math.max(200, Math.floor(listing.rating * 512));

  return (
    <div
      className={`explore-card${active ? ' explore-card--active' : ''}`}
      onClick={() => navigate(`/listings/${listing.id}`, { state: { listing } })}
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="explore-card__img-wrap">
        <img
          src={listing.img}
          alt={listing.title}
          className="explore-card__img"
          onError={(e) => {
            e.currentTarget.src = getFallbackPhoto();
          }}
        />
        <span className="explore-card__featured"><FaStar /> Featured</span>
        <span className="explore-card__discount">$100 off $399: eblwc</span>
        <button
          className={`explore-card__heart${saved ? ' explore-card__heart--active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleSave(listing.id, listing.title); }}
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          {saved ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>

      <div className="explore-card__body">
        <p className="explore-card__rating">
          <FaStar className="explore-card__star" />
          <span>({numeral(listing.rating).format('0.0')})</span>
          <span className="explore-card__review-count">{reviewCount.toLocaleString()} reviews</span>
        </p>

        <h3 className="explore-card__title">
          {listing.title}
          {listing.available && <FaCheckCircle className="explore-card__verified" />}
        </h3>

        <p className="explore-card__desc">
          Amet minim mollit non deserunt ullamco est sit aliqua dolor.
        </p>

        <div className="explore-card__meta">
          <span className="explore-card__phone">
            <FaPhone className="explore-card__meta-icon" /> (123) 456-7890
          </span>
          <span className="explore-card__directions">
            <FaMapMarkerAlt className="explore-card__meta-icon" /> Directions
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data: listings = [], isLoading, isError } = useListings({
    location: selectedLocation || undefined,
  });
  const { toggle, isSaved } = useFavorites();

  const allLocations = useMemo(() => [...new Set(listings.map((l) => l.location))].sort(), [listings]);
  const categoryCounts = useMemo(
    () => listings.reduce<Record<string, number>>((acc, l) => { acc[l.category] = (acc[l.category] || 0) + 1; return acc; }, {}),
    [listings]
  );
  const categoryOptions = useMemo(
    () => Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label, count: categoryCounts[value] || 0 })),
    [categoryCounts]
  );

  const filtered = useMemo(() => {
    if (!selectedCategories.length) return listings;
    return listings.filter((l) => selectedCategories.includes(l.category));
  }, [listings, selectedCategories]);

  const mappable = useMemo(() => filtered.filter((l) => l.lat != null && l.lng != null), [filtered]);

  return (
    <div className="explore-page">
      <div className="explore-search-bar">
        <SearchBar
          allLocations={allLocations}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          categories={categoryOptions}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
        />
      </div>

      <div className="explore-body">
        {/* Left panel */}
        <div className="explore-panel">
          <div className="explore-panel__toolbar">
            {!isLoading && !isError && (
              <p className="explore-panel__count">
                All <strong>{filtered.length.toLocaleString()}</strong> listing{filtered.length !== 1 ? 's' : ''} found
              </p>
            )}
            <div className="explore-panel__actions">
              <button className={`explore-view-btn${viewMode === 'grid' ? ' explore-view-btn--active' : ''}`} onClick={() => setViewMode('grid')} aria-label="Grid view"><FaTh /></button>
              <button className={`explore-view-btn${viewMode === 'list' ? ' explore-view-btn--active' : ''}`} onClick={() => setViewMode('list')} aria-label="List view"><FaList /></button>
            </div>
          </div>

          <div className={`explore-list${viewMode === 'grid' ? ' explore-list--grid' : ''}`}>
            {isLoading ? (
              <Spinner />
            ) : isError ? (
              <p className="explore-panel__empty">Failed to load listings.</p>
            ) : filtered.length === 0 ? (
              <p className="explore-panel__empty">No listings found.</p>
            ) : (
              filtered.map((listing) => (
                <ExploreCard
                  key={listing.id}
                  listing={listing}
                  saved={isSaved(listing.id)}
                  onToggleSave={toggle}
                  active={hoveredId === listing.id}
                  onHover={setHoveredId}
                />
              ))
            )}
          </div>
        </div>

        {/* Map panel */}
        <div className="explore-map">
          <div className="explore-map__controls">
            <button className="explore-map__filter-btn">
              <MdFilterList /> Show filters
            </button>
          </div>

          <MapContainer
            center={[20, 10]}
            zoom={2}
            className="explore-map__container"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds listings={mappable} />

            {mappable.map((listing) => (
              <Marker
                key={listing.id}
                position={[listing.lat!, listing.lng!]}
                icon={makeIcon(listing.category)}
              >
                <Popup maxWidth={220}>
                  <div className="explore-popup">
                    <img
                      src={listing.img}
                      alt={listing.title}
                      className="explore-popup__img"
                      onError={(e) => {
                        e.currentTarget.src = getFallbackPhoto();
                      }}
                    />
                    <div className="explore-popup__body">
                      <p className="explore-popup__title">{listing.title}</p>
                      <p className="explore-popup__loc"><FaMapMarkerAlt /> {listing.location}</p>
                      <p className="explore-popup__price">{numeral(listing.price).format('$0')} <small>/ night</small></p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
