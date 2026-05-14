import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FaStar, FaMapMarkerAlt, FaArrowLeft, FaCommentDots, FaUserCircle,
  FaBed, FaBath, FaUsers, FaDoorOpen, FaShieldAlt,
} from 'react-icons/fa';
import numeral from 'numeral';
import { useListing } from '../hooks/useListing';
import { useToggleSaved } from '../hooks/useToggleSaved';
import { useReviews, useCreateReview, useRespondToReview, type SubRatings } from '../hooks/useReviews';
import { useAuth } from '../../auth/hooks/useAuth';
import { BookingForm } from '../../bookings';
import MessagesPanel from '../../bookings/components/MessagesPanel';
import Spinner from '../../../shared/components/Spinner';
import './ListingDetail.css';

const POLICY_LABELS: Record<string, string> = {
  FLEXIBLE: 'Flexible — Full refund 1 day before check-in',
  MODERATE: 'Moderate — Full refund 5 days before, 50% within 1 day',
  STRICT: 'Strict — Full refund 14 days before, 50% within 7 days',
  NON_REFUNDABLE: 'Non-refundable — No refund on cancellation',
  LONG_TERM: 'Long-term — Full refund 30 days before check-in',
};

const SUB_LABELS: { key: keyof SubRatings; label: string }[] = [
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'communication', label: 'Communication' },
  { key: 'location', label: 'Location' },
  { key: 'value', label: 'Value' },
];

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="star-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={n <= value ? 'star-picker__star--on' : 'star-picker__star'}>★</button>
      ))}
    </span>
  );
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, userRole, isAuthenticated } = useAuth();

  const [showBooking, setShowBooking]   = useState(false);
  const [showContact, setShowContact]   = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [photoIdx, setPhotoIdx] = useState(0);

  const [rating, setRating]   = useState(5);
  const [comment, setComment] = useState('');
  const [subs, setSubs] = useState<SubRatings>({ cleanliness: 0, accuracy: 0, checkin: 0, communication: 0, location: 0, value: 0 });

  const { data: listing, isLoading, isError } = useListing(id);
  const { isSaved, toggle, isPending } = useToggleSaved(id ?? '');
  const { data: reviews = [] } = useReviews(id);
  const { mutate: createReview, isPending: submittingReview, error: reviewError } = useCreateReview(id);
  const { mutate: respondToReview, isPending: submittingResponse } = useRespondToReview();

  if (isLoading) return <Spinner />;
  if (isError || !listing) {
    return (
      <div className="detail-not-found">
        <p>Listing not found.</p>
        <button onClick={() => navigate(-1)} className="detail-back">← Go back</button>
      </div>
    );
  }

  const {
    title, location, price, rating: listingRating, superhost,
    img, photos, category,
    rooms, beds, bathrooms, guests: maxGuests,
    amenities, houseRules, checkInMethod, checkOutMethod,
    cancellationPolicy, instantBook,
    cleaningFee, serviceFeePercent, taxPercent,
    minNights, maxNights,
    description,
  } = listing;

  const allPhotos = photos.length ? photos : [img];

  function submitReview(e: React.FormEvent) {
    e.preventDefault();
    createReview({ rating, comment, ...subs }, {
      onSuccess: () => { setShowReviewForm(false); setComment(''); setRating(5); setSubs({ cleanliness: 0, accuracy: 0, checkin: 0, communication: 0, location: 0, value: 0 }); },
    });
  }

  return (
    <>
      <div className="detail-page">
        <button className="detail-back" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>

        {/* ── Photo Gallery ── */}
        <div className="detail-gallery">
          <img
            src={allPhotos[photoIdx]}
            alt={`${title} photo ${photoIdx + 1}`}
            className="detail-gallery__main"
          />
          {allPhotos.length > 1 && (
            <div className="detail-gallery__thumbs">
              {allPhotos.slice(0, 8).map((src, i) => (
                <button
                  key={i} type="button"
                  className={`detail-gallery__thumb${i === photoIdx ? ' detail-gallery__thumb--active' : ''}`}
                  onClick={() => setPhotoIdx(i)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
              {allPhotos.length > 8 && (
                <span className="detail-gallery__more">+{allPhotos.length - 8} more</span>
              )}
            </div>
          )}
          {superhost && <span className="detail-hero__superhost">Superhost</span>}
          <span className={`detail-hero__category detail-hero__category--${category}`}>{category}</span>
        </div>

        <div className="detail-content">
          <div className="detail-main">
            <h1 className="detail-title">{title}</h1>

            <div className="detail-meta">
              <span className="detail-rating">
                <FaStar className="detail-star" />
                {numeral(listingRating).format('0.00')}
                <span style={{ color: '#888', fontWeight: 400, fontSize: '0.85rem' }}>
                  ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </span>
              <span className="detail-location">
                <FaMapMarkerAlt className="detail-pin" />{location}
              </span>
            </div>

            {/* ── Room summary ── */}
            <div className="detail-room-row">
              <span className="detail-room-chip"><FaUsers /> {maxGuests} guests</span>
              <span className="detail-room-chip"><FaBed /> {rooms} bedroom{rooms !== 1 ? 's' : ''}</span>
              <span className="detail-room-chip"><FaBed /> {beds} bed{beds !== 1 ? 's' : ''}</span>
              <span className="detail-room-chip"><FaBath /> {bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
            </div>

            <p className="detail-description">{description || `Experience the perfect escape at this exceptional ${category} property in ${location}.`}</p>

            {/* ── Amenities ── */}
            {amenities.length > 0 && (
              <section className="detail-amenities">
                <h3 className="detail-section-title">Amenities</h3>
                <div className="detail-amenities__grid">
                  {amenities.map((a) => (
                    <span key={a} className="detail-amenity-chip">{a}</span>
                  ))}
                </div>
              </section>
            )}

            {/* ── Check-in / Check-out ── */}
            {(checkInMethod || checkOutMethod) && (
              <section className="detail-checkin-section">
                <h3 className="detail-section-title">Check-in & Check-out</h3>
                {checkInMethod && <p className="detail-checkin-row"><FaDoorOpen /> <strong>Check-in:</strong> {checkInMethod}</p>}
                {checkOutMethod && <p className="detail-checkin-row"><FaDoorOpen /> <strong>Check-out:</strong> {checkOutMethod}</p>}
                {minNights > 1 && <p className="detail-checkin-row">Minimum stay: <strong>{minNights} nights</strong></p>}
                {maxNights && <p className="detail-checkin-row">Maximum stay: <strong>{maxNights} nights</strong></p>}
              </section>
            )}

            {/* ── House Rules ── */}
            {houseRules && (
              <section className="detail-rules-section">
                <h3 className="detail-section-title">House Rules</h3>
                <p className="detail-rules-text">{houseRules}</p>
              </section>
            )}

            {/* ── Cancellation Policy ── */}
            <section className="detail-policy-section">
              <h3 className="detail-section-title"><FaShieldAlt /> Cancellation Policy</h3>
              <p className="detail-policy-text">{POLICY_LABELS[cancellationPolicy] ?? cancellationPolicy}</p>
            </section>

            {/* ── Reviews Section ── */}
            <section className="detail-reviews">
              <div className="detail-reviews__header">
                <h2><FaStar className="detail-star" /> {numeral(listingRating).format('0.00')} · {reviews.length} Review{reviews.length !== 1 ? 's' : ''}</h2>
                {userId && (
                  <button className="detail-review-btn" onClick={() => setShowReviewForm((v) => !v)}>
                    {showReviewForm ? 'Cancel' : '+ Write a review'}
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form className="detail-review-form" onSubmit={submitReview}>
                  <div className="review-form-overall">
                    <label>Overall Rating</label>
                    <StarPicker value={rating} onChange={setRating} />
                  </div>
                  <div className="review-form-subs">
                    {SUB_LABELS.map(({ key, label }) => (
                      <div key={key} className="review-form-sub">
                        <label>{label}</label>
                        <StarPicker value={subs[key]} onChange={(n) => setSubs((p) => ({ ...p, [key]: n }))} />
                      </div>
                    ))}
                  </div>
                  <textarea className="review-form-comment" placeholder="Share your experience…"
                    value={comment} onChange={(e) => setComment(e.target.value)} rows={4} required />
                  {reviewError && (
                    <p className="review-form-error">
                      {(reviewError as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit review.'}
                    </p>
                  )}
                  <button className="review-form-submit" type="submit" disabled={submittingReview}>
                    {submittingReview ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              )}

              {reviews.length === 0 ? (
                <p className="detail-reviews__empty">No reviews yet. Be the first!</p>
              ) : (
                <div className="detail-reviews__list">
                  {reviews.map((r) => (
                    <article key={r.id} className="review-item">
                      <div className="review-item__head">
                        <FaUserCircle className="review-item__avatar" />
                        <div>
                          <strong>{r.user.name}</strong>
                          <time>{dayjs(r.createdAt).format('MMM YYYY')}</time>
                        </div>
                        <span className="review-item__stars">
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </span>
                      </div>
                      {(r.cleanliness || r.accuracy || r.checkin || r.communication || r.location || r.value) ? (
                        <div className="review-item__subs">
                          {SUB_LABELS.filter(({ key }) => r[key] > 0).map(({ key, label }) => (
                            <span key={key} className="review-item__sub">{label}: <strong>{r[key]}/5</strong></span>
                          ))}
                        </div>
                      ) : null}
                      <p className="review-item__comment">{r.comment}</p>
                      {r.response && (
                        <div className="review-item__response">
                          <strong>Host response:</strong>
                          <p>{r.response}</p>
                        </div>
                      )}
                      {userRole === 'HOST' && !r.response && (
                        respondingTo === r.id ? (
                          <form className="review-item__respond-form" onSubmit={(e) => {
                            e.preventDefault();
                            respondToReview({ reviewId: r.id, response: responseText }, {
                              onSuccess: () => { setRespondingTo(null); setResponseText(''); },
                            });
                          }}>
                            <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Write your public response…" rows={2} />
                            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                              <button type="submit" className="review-form-submit" disabled={submittingResponse}>
                                {submittingResponse ? 'Posting…' : 'Post Response'}
                              </button>
                              <button type="button" onClick={() => setRespondingTo(null)} className="detail-review-btn">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <button className="review-item__respond-btn" onClick={() => setRespondingTo(r.id)}>
                            Respond publicly
                          </button>
                        )
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {showContact && (
              <section style={{ marginTop: '1.5rem' }}>
                <MessagesPanel enquiryListingId={id} enquiryListingTitle={title} />
              </section>
            )}
          </div>

          <aside className="detail-sidebar">
            <div className="detail-booking-card">
              <div className="detail-price">
                <strong>{numeral(price).format('$0')}</strong>
                <span className="detail-price__night"> / night</span>
              </div>

              {/* Price breakdown preview */}
              <div className="detail-price-hints">
                {cleaningFee > 0 && <span>+ {numeral(cleaningFee).format('$0')} cleaning</span>}
                {serviceFeePercent > 0 && <span>+ {serviceFeePercent}% service fee</span>}
                {taxPercent > 0 && <span>+ {taxPercent}% taxes</span>}
              </div>

              {instantBook && <span className="detail-instant-badge">⚡ Instant Book</span>}

              <button
                className={`detail-save-btn${isSaved ? ' detail-save-btn--saved' : ''}`}
                onClick={() => toggle(title)}
                disabled={isPending}
              >
                {isSaved ? '♥ Saved' : '♡ Save listing'}
              </button>

              {userId && (
                <button className="detail-contact-btn" onClick={() => setShowContact((v) => !v)}>
                  <FaCommentDots /> {showContact ? 'Hide messages' : 'Contact Host'}
                </button>
              )}

              <button
                className="detail-book-btn"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }
                  if (userRole !== 'GUEST') {
                    alert('Only guests can make a booking. Switch to a guest account to continue.');
                    return;
                  }
                  setShowBooking(true);
                }}
              >
                {instantBook ? '⚡ Instant Book' : 'Request to Book'}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {showBooking && (
        <BookingForm
          listingId={listing.id}
          listingTitle={title}
          listingPrice={price}
          cleaningFee={cleaningFee}
          serviceFeePercent={serviceFeePercent}
          taxPercent={taxPercent}
          maxGuests={maxGuests}
          minNights={minNights}
          maxNights={maxNights ?? undefined}
          instantBook={instantBook}
          onClose={() => setShowBooking(false)}
        />
      )}
    </>
  );
}
