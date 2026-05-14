import { z } from 'zod';

export const datesSchema = z
  .object({
    checkIn: z.string().min(1, 'Check-in date is required'),
    checkOut: z.string().min(1, 'Check-out date is required'),
    guests: z
      .number()
      .int('Must be a whole number')
      .min(1, 'At least 1 guest required')
      .max(16, 'Maximum 16 guests'),
  })
  .refine((data) => !data.checkIn || !data.checkOut || new Date(data.checkOut) > new Date(data.checkIn), {
    message: 'Check-out must be after check-in',
    path: ['checkOut'],
  });

export const personalSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7, 'Phone must be at least 7 characters'),
  photo: z
    .any()
    .optional()
    .refine(
      (val: unknown) =>
        val === undefined ||
        val === null ||
        !(val instanceof FileList) ||
        val.length === 0 ||
        val[0].size <= 5 * 1024 * 1024,
      'Photo must be 5MB or less'
    ),
});

export const paymentSchema = z.object({
  card: z.string().regex(/^\d{16}$/, 'Card number must be exactly 16 digits'),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be in MM/YY format'),
  cvv: z.string().regex(/^\d{3}$/, 'CVV must be exactly 3 digits'),
});

export type DatesFormData = z.infer<typeof datesSchema>;
export type PersonalFormData = z.infer<typeof personalSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
