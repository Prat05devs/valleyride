import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { FULL_REFUND_HOURS, LATE_REFUND_PCT } from '@valleyride/shared';
import { LegalPage, List, Section } from '@/components/legal/legal-page';

export const metadata: Metadata = pageMetadata({
  title: 'Cancellation and refund policy',
  description: 'How cancellations, refunds and security-deposit returns work for Valley Ride rentals.',
  path: '/refund-policy',
});

/** Mirrors cancellationRefund() and returnCharges() in @valleyride/shared, which the API applies. */
export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Cancellation and refund policy"
      path="/refund-policy"
      intro={<p>This page explains what you get back if you cancel, how the security deposit is returned, and how long refunds take. Every refund goes back to the card, UPI account or bank account you paid with, through Razorpay.</p>}
    >
      <Section title="If you cancel">
        <List items={[
          <><strong>More than {FULL_REFUND_HOURS} hours before pickup:</strong> full refund of the rental.</>,
          <><strong>Within {FULL_REFUND_HOURS} hours of pickup:</strong> {LATE_REFUND_PCT}% of the rental is refunded.</>,
          <><strong>The security deposit</strong> is always refunded in full when you cancel.</>,
        ]} />
        <p>Cancel in the app from <strong>Trips → your booking → Cancel booking</strong>, or in <Link href="/account/bookings">My bookings</Link> on the website. The app shows the exact refund before you confirm. If you do not turn up and do not cancel, the booking is treated as cancelled within {FULL_REFUND_HOURS} hours of pickup.</p>
      </Section>

      <Section title="If we cancel, or the payment comes too late">
        <List items={[
          'If we cancel your booking for any reason, for example because the vehicle is unavailable or unsafe, you get a full refund of everything you paid.',
          'If your payment completes after the 15-minute hold has ended and the bike has been booked by someone else, you get a full refund.',
          'If you pay to extend a trip but someone else books the bike for that time while you are paying, the extension payment is refunded in full.',
          'If a vehicle breaks down during your rental through no fault of yours and we cannot replace it, we refund the unused rental days.',
        ]} />
      </Section>

      <Section title="Security deposit at return">
        <p>We inspect the vehicle when you return it. The following are deducted from the deposit, and the rest is refunded:</p>
        <List items={[
          'kilometres beyond the allowance included in your booking, at the per-km rate shown for that bike;',
          'late return, at one eighth of the day price for each started hour past your end time;',
          'the cost of repairing damage found at inspection that was not noted at pickup.',
        ]} />
        <p>These amounts include GST, and you receive an itemised invoice. If the charges are more than the deposit, the difference is payable before we close the booking.</p>
      </Section>

      <Section title="How long refunds take">
        <p>We start refunds within 1 working day of a cancellation or a completed return inspection. Your bank usually credits the money in <strong>5–7 working days</strong>; UPI refunds are often faster. The app and the website show each refund&apos;s status in your trip and payment history. If a refund has not arrived after 7 working days, contact us with your booking code and we will send you the Razorpay refund reference.</p>
      </Section>

      <Section title="Coupons and discounts">
        <p>Refunds are calculated on what you actually paid, after any multi-day discount or coupon. A coupon used on a cancelled booking is not given back.</p>
      </Section>
    </LegalPage>
  );
}
