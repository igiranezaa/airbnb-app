import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentSchema, type PaymentFormData } from '../schemas/booking';

interface Props {
  defaultValues?: PaymentFormData;
  onNext: (data: PaymentFormData) => void;
  onBack: () => void;
}

export default function StepPayment({ defaultValues, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="booking-form">
      <h2 className="booking-form__title">Payment Details</h2>

      <div className="form-group">
        <label className="form-label" htmlFor="card">
          Card Number
        </label>
        <input
          id="card"
          type="text"
          maxLength={16}
          placeholder="1234567812345678"
          className={`form-input${errors.card ? ' form-input--error' : ''}`}
          {...register('card')}
        />
        {errors.card && <span className="form-error">{errors.card.message}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="expiry">
            Expiry (MM/YY)
          </label>
          <input
            id="expiry"
            type="text"
            maxLength={5}
            placeholder="01/27"
            className={`form-input${errors.expiry ? ' form-input--error' : ''}`}
            {...register('expiry')}
          />
          {errors.expiry && (
            <span className="form-error">{errors.expiry.message}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="cvv">
            CVV
          </label>
          <input
            id="cvv"
            type="text"
            maxLength={3}
            placeholder="123"
            className={`form-input${errors.cvv ? ' form-input--error' : ''}`}
            {...register('cvv')}
          />
          {errors.cvv && <span className="form-error">{errors.cvv.message}</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="btn-primary">
          Continue
        </button>
      </div>
    </form>
  );
}
