import { useState } from 'react';
import {
  FaCalendarAlt, FaCheckCircle, FaClock, FaCommentDots,
  FaMapMarkerAlt, FaTimesCircle,
} from 'react-icons/fa';
import { useBookings, useCancelBooking, type Booking } from '../hooks/useBookings';
import Spinner from '../../../shared/components/Spinner';
import './BookingsPanel.css';

interface Props {
  onMessage: (booking: Booking) => void;
}

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmed', icon: <FaCheckCircle />, cls: 'bk-status--confirmed' },
  PENDING: { label: 'Pending', icon: <FaClock />, cls: 'bk-status--pending' },
  CANCELLED: { label: 'Cancelled', icon: <FaTimesCircle />, cls: 'bk-status--cancelled' },
} as const;

export default function BookingsPanel({ onMessage }: Props) {
  const { data: bookings = [], isLoading, isError } = useBookings();
  const { mutate: cancel, isPending: isCancelling } = useCancelBooking();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function handleCancel(id: string) {
    setCancellingId(id);
    cancel(id, { onSettled: () => setCancellingId(null) });
  }

  return (
    <section className="db-panel db-bookings">
      <div className="db-panel__header">
        <h2>My Bookings</h2>
        {!isLoading && !isError && (
          <span className="bk-total">{bookings.length} total</span>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p className="bk-empty">Failed to load bookings. Make sure you are logged in.</p>
      ) : bookings.length === 0 ? (
        <p className="bk-empty">No bookings yet.</p>
      ) : (
        <ul className="bk-list">
          {bookings.map((booking) => {
            const status = STATUS_CONFIG[booking.status];
            const nights = Math.max(
              1,
              Math.round(
                (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
                  86400000
              )
            );
            return (
              <li key={booking.id} className="bk-item">
                <div className="bk-item__info">
                  <h3 className="bk-item__title">{booking.listing.title}</h3>
                  <p className="bk-item__location">
                    <FaMapMarkerAlt /> {booking.listing.location}
                  </p>
                  <p className="bk-item__dates">
                    <FaCalendarAlt />
                    {new Date(booking.checkIn).toLocaleDateString()} →{' '}
                    {new Date(booking.checkOut).toLocaleDateString()}
                    <span className="bk-item__nights">
                      {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                  </p>
                  <p className="bk-item__price">${booking.totalPrice.toLocaleString()} total</p>
                </div>

                <div className="bk-item__right">
                  <span className={`bk-status ${status.cls}`}>
                    {status.icon} {status.label}
                  </span>
                  {booking.status === 'PENDING' && (
                    <p className="bk-item__pending-note">Waiting for host approval</p>
                  )}
                  {booking.status === 'CANCELLED' && booking.rejectionReason && (
                    <div className="bk-item__rejection">
                      <span className="bk-item__rejection-label">Cancelled by host:</span>
                      <span className="bk-item__rejection-text">{booking.rejectionReason}</span>
                    </div>
                  )}
                  <div className="bk-item__actions">
                    <button
                      className="bk-btn bk-btn--message"
                      onClick={() => onMessage(booking)}
                      aria-label="Message host about this booking"
                    >
                      <FaCommentDots /> Message
                    </button>
                    {booking.status !== 'CANCELLED' && (
                      <button
                        className="bk-btn bk-btn--cancel"
                        onClick={() => handleCancel(booking.id)}
                        disabled={isCancelling && cancellingId === booking.id}
                        aria-label="Cancel booking"
                      >
                        <FaTimesCircle />{' '}
                        {cancellingId === booking.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
