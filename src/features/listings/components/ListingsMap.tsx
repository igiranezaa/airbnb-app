import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import type { Listing } from '../types';
import numeral from 'numeral';

// Fix Leaflet broken default icons in Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makePriceIcon(price: number, active: boolean) {
  return L.divIcon({
    html: `<span class="lmap-pin${active ? ' lmap-pin--on' : ''}">$${price}</span>`,
    className: 'lmap-icon',
    iconSize:   [0, 0],
    iconAnchor: [0, 0],
  });
}

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  const coords = listings.filter((l) => l.lat != null && l.lng != null);
  useMemo(() => {
    if (!coords.length) return;
    const bounds = L.latLngBounds(coords.map((l) => [l.lat!, l.lng!]));
    map.fitBounds(bounds, { padding: [50, 50] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords.length]);
  return null;
}

export default function ListingsMap({
  listings,
  hoveredId,
  onHover,
}: {
  listings: Listing[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const visible = listings.filter((l) => l.lat != null && l.lng != null);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="lmap-container"
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <FitBounds listings={visible} />
      {visible.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat!, listing.lng!]}
          icon={makePriceIcon(listing.price, listing.id === hoveredId)}
          zIndexOffset={listing.id === hoveredId ? 1000 : 0}
          eventHandlers={{
            mouseover: () => onHover(listing.id),
            mouseout:  () => onHover(null),
          }}
        >
          <Popup className="lmap-popup-wrap" maxWidth={220}>
            <Link to={`/listings/${listing.id}`} className="lmap-popup">
              <img src={listing.img} alt={listing.title} className="lmap-popup__img" />
              <div className="lmap-popup__body">
                <p className="lmap-popup__title">{listing.title}</p>
                <p className="lmap-popup__meta">
                  <FaStar className="lmap-popup__star" />
                  {listing.rating.toFixed(2)}
                </p>
                <p className="lmap-popup__price">
                  <strong>{numeral(listing.price).format('$0,0')}</strong> / night
                </p>
              </div>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
