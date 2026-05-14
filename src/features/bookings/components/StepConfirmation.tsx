import { differenceInCalendarDays } from 'date-fns';
import numeral from 'numeral';
import type { DatesFormData, PersonalFormData, PaymentFormData } from '../schemas/booking';

interface Props {
  dates: DatesFormData;
  personal: PersonalFormData;
  payment: PaymentFormData;
  listingTitle: string;
  listingPrice: number;
  cleaningFee?: number;
  serviceFeePercent?: number;
  taxPercent?: number;
  instantBook?: boolean;
  isSubmitting?: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

function maskCard(card: string): string {
  return `**** **** **** ${card.slice(-4)}`;
}

export default function StepConfirmation({
  dates, personal, payment,
  listingTitle, listingPrice,
  cleaningFee = 0, serviceFeePercent = 14, taxPercent = 0,
  instantBook = false,
  isSubmitting = false,
  onBack, onSubmit,
}: Props) {
  const nights = differenceInCalendarDays(new Date(dates.checkOut), new Date(dates.checkIn));
  const nightlyTotal = nights * listingPrice;
  const serviceFee   = Math.round(nightlyTotal * serviceFeePercent) / 100;
  const taxes        = Math.round(nightlyTotal * taxPercent) / 100;
  const total        = nightlyTotal + cleaningFee + serviceFee + taxes;

  return (
    <div className="booking-form">
      <h2 className="booking-form__title">Confirm Booking</h2>

      {instantBook && (
        <div className="booking-instant-notice">⚡ Your booking will be confirmed immediately</div>
      )}

      <section className="confirmation-section">
        <h3 className="confirmation-section__heading">Listing</h3>
        <p className="confirmation-row">
          <span>{listingTitle}</span>
          <span>{numeral(listingPrice).format('$0')} / night</span>
        </p>
      </section>

      <section className="confirmation-section">
        <h3 className="confirmation-section__heading">Stay Details</h3>
        <p className="confirmation-row"><span>Check-in</span><span>{dates.checkIn}</span></p>
        <p className="confirmation-row"><span>Check-out</span><span>{dates.checkOut}</span></p>
        <p className="confirmation-row"><span>Guests</span><span>{dates.guests}</span></p>
        <p className="confirmation-row"><span>{nights} night{nights !== 1 ? 's' : ''} × {numeral(listingPrice).format('$0')}</span><span>{numeral(nightlyTotal).format('$0,0')}</span></p>
        {cleaningFee > 0 && (
          <p className="confirmation-row"><span>Cleaning fee</span><span>{numeral(cleaningFee).format('$0,0')}</span></p>
        )}
        {serviceFee > 0 && (
          <p className="confirmation-row"><span>Service fee ({serviceFeePercent}%)</span><span>{numeral(serviceFee).format('$0,0')}</span></p>
        )}
        {taxes > 0 && (
          <p className="confirmation-row"><span>Taxes ({taxPercent}%)</span><span>{numeral(taxes).format('$0,0')}</span></p>
        )}
        <p className="confirmation-row confirmation-row--total">
          <span>Total</span>
          <strong>{numeral(total).format('$0,0')}</strong>
        </p>
      </section>

      <section className="confirmation-section">
        <h3 className="confirmation-section__heading">Guest Info</h3>
        <p className="confirmation-row"><span>Name</span><span>{personal.name}</span></p>
        <p className="confirmation-row"><span>Email</span><span>{personal.email}</span></p>
        <p className="confirmation-row"><span>Phone</span><span>{personal.phone}</span></p>
        {personal.photo instanceof FileList && personal.photo.length > 0 && (
          <p className="confirmation-row"><span>Photo</span><span>Uploaded</span></p>
        )}
      </section>

      <section className="confirmation-section">
        <h3 className="confirmation-section__heading">Payment</h3>
        <p className="confirmation-row"><span>Card</span><span>{maskCard(payment.card)}</span></p>
        <p className="confirmation-row"><span>Expiry</span><span>{payment.expiry}</span></p>
      </section>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
        <button
          type="button"
          className="btn-primary btn-primary--confirm"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending…' : instantBook ? '⚡ Confirm & Book' : 'Send Request'}
        </button>
      </div>
    </div>
  );
}
