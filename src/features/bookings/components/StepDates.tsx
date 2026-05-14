import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { datesSchema, type DatesFormData } from '../schemas/booking';

interface Props {
  defaultValues?: DatesFormData;
  minNights?: number;
  maxNights?: number;
  maxGuests?: number;
  onNext: (data: DatesFormData) => void;
}

export default function StepDates({ defaultValues, minNights = 1, maxNights, maxGuests, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatesFormData>({
    resolver: zodResolver(datesSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="booking-form">
      <h2 className="booking-form__title">Select Dates</h2>

      <div className="form-group">
        <label className="form-label" htmlFor="checkIn">Check-in Date</label>
        <input id="checkIn" type="date" className={`form-input${errors.checkIn ? ' form-input--error' : ''}`}
          {...register('checkIn')} />
        {errors.checkIn && <span className="form-error">{errors.checkIn.message}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="checkOut">Check-out Date</label>
        <input id="checkOut" type="date" className={`form-input${errors.checkOut ? ' form-input--error' : ''}`}
          {...register('checkOut')} />
        {errors.checkOut && <span className="form-error">{errors.checkOut.message}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="guests">
          Number of Guests{maxGuests ? ` (max ${maxGuests})` : ''}
        </label>
        <input id="guests" type="number" min={1} max={maxGuests ?? 16} placeholder="1"
          className={`form-input${errors.guests ? ' form-input--error' : ''}`}
          {...register('guests', { valueAsNumber: true })} />
        {errors.guests && <span className="form-error">{errors.guests.message}</span>}
      </div>

      {(minNights > 1 || maxNights) && (
        <p className="form-hint">
          Stay length: {minNights > 1 ? `min ${minNights} nights` : ''}
          {minNights > 1 && maxNights ? ' · ' : ''}
          {maxNights ? `max ${maxNights} nights` : ''}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary">Continue</button>
      </div>
    </form>
  );
}
