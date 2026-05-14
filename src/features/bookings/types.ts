import type { DatesFormData, PersonalFormData, PaymentFormData } from './schemas/booking';

export type { DatesFormData, PersonalFormData, PaymentFormData };

export interface BookingState {
  dates: DatesFormData | null;
  personal: PersonalFormData | null;
  payment: PaymentFormData | null;
}
