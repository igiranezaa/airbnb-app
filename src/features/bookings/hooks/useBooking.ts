import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import type { BookingState, DatesFormData, PersonalFormData, PaymentFormData } from '../types';

type StepData = DatesFormData | PersonalFormData | PaymentFormData;

export function useBooking(listingId: string) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<BookingState>({
    dates: null,
    personal: null,
    payment: null,
  });

  const next = (data: StepData) => {
    setBookingData((prev) => {
      if (currentStep === 0) return { ...prev, dates: data as DatesFormData };
      if (currentStep === 1) return { ...prev, personal: data as PersonalFormData };
      if (currentStep === 2) return { ...prev, payment: data as PaymentFormData };
      return prev;
    });
    setCurrentStep((prev) => prev + 1);
  };

  const back = () => setCurrentStep((prev) => Math.max(0, prev - 1));

  const submit = async (): Promise<boolean> => {
    if (!bookingData.dates || isSubmitting) return false;
    setIsSubmitting(true);
    try {
      await api.post('/bookings', {
        listingId,
        checkIn: bookingData.dates.checkIn,
        checkOut: bookingData.dates.checkOut,
        guestCount: bookingData.dates.guests,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['host-listings'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['listings'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['listing', listingId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] }),
      ]);
      toast.success('Booking request sent! Waiting for host approval.');
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Booking failed. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { currentStep, bookingData, next, back, submit, isSubmitting };
}
