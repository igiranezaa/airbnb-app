import { useEffect } from 'react';
import { useBooking } from '../hooks/useBooking';
import StepDates from './StepDates';
import StepPersonal from './StepPersonal';
import StepPayment from './StepPayment';
import StepConfirmation from './StepConfirmation';
import type { DatesFormData, PersonalFormData, PaymentFormData } from '../schemas/booking';
import './BookingForm.css';

const STEPS = ['Dates', 'Personal Info', 'Payment', 'Confirm'];

interface Props {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  cleaningFee?: number;
  serviceFeePercent?: number;
  taxPercent?: number;
  maxGuests?: number;
  minNights?: number;
  maxNights?: number;
  instantBook?: boolean;
  onClose: () => void;
}

export default function BookingForm({
  listingId,
  listingTitle,
  listingPrice,
  cleaningFee = 0,
  serviceFeePercent = 14,
  taxPercent = 0,
  maxGuests,
  minNights = 1,
  maxNights,
  instantBook = false,
  onClose,
}: Props) {
  const { currentStep, bookingData, next, back, submit, isSubmitting } = useBooking(listingId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="booking-overlay"
      role="dialog" aria-modal="true" aria-label="Booking form"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="booking-modal">
        <button className="booking-modal__close" onClick={onClose} aria-label="Close booking form">×</button>

        {instantBook && (
          <div className="booking-instant-notice">⚡ Instant Book — your booking will be confirmed immediately</div>
        )}

        {/* Step indicators */}
        <div className="booking-steps">
          {STEPS.map((label, i) => (
            <div key={label}
              className={`booking-step ${i === currentStep ? 'booking-step--active' : ''} ${i < currentStep ? 'booking-step--done' : ''}`}>
              <div className="booking-step__dot">{i < currentStep ? '✓' : i + 1}</div>
              <span className="booking-step__label">{label}</span>
            </div>
          ))}
        </div>

        <p className="booking-step-info">Step {currentStep + 1} of {STEPS.length}</p>

        {currentStep === 0 && (
          <StepDates
            defaultValues={bookingData.dates ?? undefined}
            minNights={minNights}
            maxNights={maxNights}
            maxGuests={maxGuests}
            onNext={(data: DatesFormData) => next(data)}
          />
        )}
        {currentStep === 1 && (
          <StepPersonal
            defaultValues={bookingData.personal ? { name: bookingData.personal.name, email: bookingData.personal.email, phone: bookingData.personal.phone } : undefined}
            onNext={(data: PersonalFormData) => next(data)}
            onBack={back}
          />
        )}
        {currentStep === 2 && (
          <StepPayment
            defaultValues={bookingData.payment ?? undefined}
            onNext={(data: PaymentFormData) => next(data)}
            onBack={back}
          />
        )}
        {currentStep === 3 && bookingData.dates && bookingData.personal && bookingData.payment && (
          <StepConfirmation
            dates={bookingData.dates}
            personal={bookingData.personal}
            payment={bookingData.payment}
            listingTitle={listingTitle}
            listingPrice={listingPrice}
            cleaningFee={cleaningFee}
            serviceFeePercent={serviceFeePercent}
            taxPercent={taxPercent}
            instantBook={instantBook}
            isSubmitting={isSubmitting}
            onBack={back}
            onSubmit={async () => {
              const ok = await submit();
              if (ok) onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}
