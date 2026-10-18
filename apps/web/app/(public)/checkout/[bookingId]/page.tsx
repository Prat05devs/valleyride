import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/site-header';
import { Checkout } from '@/components/booking/checkout';

export const metadata: Metadata = { title: 'Review & pay', robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  return (
    <div className="pb-20">
      <SiteHeader />
      <Checkout bookingId={(await params).bookingId} />
    </div>
  );
}
