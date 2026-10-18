import { Suspense } from 'react';
import { BookingDetail } from '@/components/account/booking-detail';

export const metadata = { title: 'Booking', robots: { index: false } };

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense><BookingDetail id={id} /></Suspense>;
}
