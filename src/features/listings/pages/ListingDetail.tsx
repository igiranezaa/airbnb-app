import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { FaStar, FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';
import numeral from 'numeral';
import { useStore } from '../../../store/StoreContext';
import { useFavorites } from '../hooks/useFavorites';
import { useListings } from '../hooks/useListings';
import Spinner from '../../../shared/components/Spinner';
import './ListingDetail.css';

export default function ListingDetail() {
  useListings();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useStore();
  const { isSaved, toggle } = useFavorites();

  const listing = state.listings.find((l) => l.id === Number(id));

  if (state.loading) {
    return <Spinner />;
  }

  if (!listing) {
    return (
      <div className="detail-not-found">
        <p>Listing not found.</p>
        <button onClick={() => navigate(-1)} className="detail-back">
          ← Go back
        </button>
      </div>
    );
  }

  const { title, location, price, rating, superhost, available, availableFrom, img, category } = listing;
  const saved = isSaved(listing.id);

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      <div className="detail-hero">
        <img src={img} alt={title} className="detail-hero__image" />
        {superhost && <span className="detail-hero__superhost">Superhost</span>}
        <span className={`detail-hero__category detail-hero__category--${category}`}>
          {category}
        </span>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <h1 className="detail-title">{title}</h1>

          <div className="detail-meta">
            <span className="detail-rating">
              <FaStar className="detail-star" />
              {numeral(rating).format('0.00')}
            </span>
            <span className="detail-location">
              <FaMapMarkerAlt className="detail-pin" />
              {location}
            </span>
          </div>

          <div className="detail-availability">
            <span className={`detail-status detail-status--${available ? 'available' : 'booked'}`}>
              {available ? 'Available' : 'Booked'}
            </span>
            <span className="detail-available-from">
              Available from {dayjs(availableFrom).format('MMM D, YYYY')}
            </span>
          </div>

          <p className="detail-description">
            Experience the perfect escape at this exceptional {category} property. Whether you're
            looking for relaxation or adventure, {title} offers everything you need for an
            unforgettable stay in {location}.
          </p>
        </div>

        <aside className="detail-sidebar">
          <div className="detail-booking-card">
            <div className="detail-price">
              <strong>{numeral(price).format('$0')}</strong>
              <span className="detail-price__night"> / night</span>
            </div>

            <button
              className={`detail-save-btn${saved ? ' detail-save-btn--saved' : ''}`}
              onClick={() => toggle(listing.id, title)}
            >
              {saved ? '♥ Saved' : '♡ Save listing'}
            </button>

            {!available && (
              <p className="detail-booked-notice">
                This listing is currently booked. Check back later.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
