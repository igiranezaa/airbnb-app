import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalSchema, type PersonalFormData } from '../schemas/booking';

interface Props {
  defaultValues?: Omit<PersonalFormData, 'photo'>;
  onNext: (data: PersonalFormData) => void;
  onBack: () => void;
}

export default function StepPersonal({ defaultValues, onNext, onBack }: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues,
  });

  const photoValue = watch('photo') as FileList | undefined;

  useEffect(() => {
    if (photoValue instanceof FileList && photoValue.length > 0) {
      const url = URL.createObjectURL(photoValue[0]);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [photoValue]);

  return (
    <form onSubmit={handleSubmit(onNext)} className="booking-form">
      <h2 className="booking-form__title">Personal Info</h2>

      <div className="form-group">
        <label className="form-label" htmlFor="name">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="Jane Doe"
          className={`form-input${errors.name ? ' form-input--error' : ''}`}
          {...register('name')}
        />
        {errors.name && <span className="form-error">{errors.name.message}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="jane@example.com"
          className={`form-input${errors.email ? ' form-input--error' : ''}`}
          {...register('email')}
        />
        {errors.email && <span className="form-error">{errors.email.message}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="phone">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="+1 555 000 0000"
          className={`form-input${errors.phone ? ' form-input--error' : ''}`}
          {...register('phone')}
        />
        {errors.phone && <span className="form-error">{errors.phone.message}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="photo">
          Profile Photo <span className="form-label--hint">(optional, max 5 MB)</span>
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          className="form-file"
          {...register('photo')}
        />
        {errors.photo && (
          <span className="form-error">{String(errors.photo.message)}</span>
        )}
        {preview && (
          <div className="photo-preview">
            <img src={preview} alt="Profile preview" className="photo-preview__img" />
          </div>
        )}
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
