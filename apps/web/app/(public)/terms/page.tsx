import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { FULL_REFUND_HOURS, LATE_REFUND_PCT } from '@valleyride/shared';
import { LegalPage, List, Section } from '@/components/legal/legal-page';

export const metadata: Metadata = pageMetadata({
  title: 'Rental terms',
  description: 'The terms for renting a scooter or motorcycle from Valley Ride through the app or valleyride.in.',
  path: '/terms',
});

/** The rental agreement in plain language; numbers come from the shared policy used by the API and app. */
export default function TermsPage() {
  return (
    <LegalPage
      title="Rental terms"
      path="/terms"
      intro={<p>These terms apply when you create a Valley Ride account or rent a vehicle through the app, this website or a pickup desk. At pickup, you also sign a rental agreement for that trip. By booking, you agree to these terms, our <Link href="/privacy" className="text-ink underline">privacy policy</Link> and our <Link href="/refund-policy" className="text-ink underline">cancellation and refund policy</Link>.</p>}
    >
      <Section title="Who can rent">
        <List items={[
          'You must be at least 18 years old.',
          'You need a valid Indian driving licence for the class of vehicle you rent: a gearless licence for scooters, a motorcycle-with-gear licence for motorcycles. International riders need their home licence together with an International Driving Permit.',
          'Bring your original licence and an ID proof to pickup. We may refuse a rental if the documents are missing, expired or do not match the account, or if the rider appears unfit to ride.',
        ]} />
      </Section>

      <Section title="Booking and payment">
        <p>When you continue to payment, we hold the bike for 15 minutes. You pay the rental and a refundable security deposit together, through Razorpay, in Indian rupees. The booking is confirmed only when Razorpay confirms the payment. If the payment arrives after the hold has ended and the bike has gone, we refund it in full. The total shown at checkout, including 18% GST and any multi-day discount or coupon, is what you pay.</p>
      </Section>

      <Section title="Cancellations and changes">
        <p>If you cancel more than {FULL_REFUND_HOURS} hours before pickup, you get the full rental back. Within {FULL_REFUND_HOURS} hours, you get {LATE_REFUND_PCT}% back. The deposit is always refunded in full. You can extend a trip from the app if the bike is free for the extra time. Full details are on the <Link href="/refund-policy">cancellation and refund page</Link>.</p>
      </Section>

      <Section title="Pickup">
        <p>Collect the vehicle from the pickup point and at the time you booked. Our staff record the odometer reading and fuel level, photograph the vehicle with you, and go through a checklist. You then sign the rental agreement on your phone. Check the vehicle and point out any existing marks before you ride away. Anything not noted at pickup is treated as new at return.</p>
      </Section>

      <Section title="On the ride">
        <List items={[
          'Helmets are compulsory for rider and pillion. Carry no more than one pillion rider.',
          'Only the person named on the booking, with the licence checked at pickup, may ride the vehicle.',
          'Do not ride under the influence of alcohol or drugs, race, perform stunts, ride off-road beyond normal gravel roads, use the vehicle for hire or delivery work, or take it outside Uttarakhand without our written permission.',
          'Follow traffic laws. Traffic fines, challans, tolls, parking charges and penalties during your rental are your responsibility, even if they reach us after the trip.',
          'Each booking includes a kilometre allowance, shown when you book. Extra kilometres are charged at the rate shown for that bike, including GST.',
          'Fuel is not included. Please return the vehicle with at least the fuel level recorded at pickup.',
        ]} />
      </Section>

      <Section title="Return and late return">
        <p>Return the vehicle to the point you collected it from by the end time on your booking. Late returns are charged per started hour at one eighth of the bike&apos;s day price, including GST. If you need more time, extend the trip in the app before the end time. An extension depends on the bike being free.</p>
      </Section>

      <Section title="Deposit, damage, accidents and theft">
        <p>We inspect the vehicle at return. Extra kilometres, late hours and the cost of repairing damage found at inspection are deducted from the deposit. The rest goes back to the card or UPI you paid with. If the charges exceed the deposit, you pay the difference.</p>
        <p>In an accident, breakdown or theft, make sure everyone is safe, then call us straight away. For an accident involving injury or another vehicle, or for a theft, you must file a police report (FIR). You are responsible for loss or damage caused by negligence, by breaking these terms, or while riding under the influence or without a valid licence, up to the cost of repair or replacement.</p>
      </Section>

      <Section title="Your account">
        <p>Keep your password private. You are responsible for bookings made from your account. We may suspend an account that gives false documents, does not pay what it owes or misuses a vehicle. You can <Link href="/delete-account">delete your account</Link> at any time.</p>
      </Section>

      <Section title="Our responsibility">
        <p>We maintain our vehicles and check them before every rental. If a vehicle breaks down through no fault of yours, we will repair or replace it as soon as we reasonably can, or refund the unused rental. As far as the law allows, we are not liable for indirect losses such as missed plans, accommodation or onward travel.</p>
      </Section>

      <Section title="Governing law">
        <p>These terms are governed by the laws of India. Disputes are subject to the courts at Dehradun, Uttarakhand. We may update these terms, and the version on this page when you book applies to that booking.</p>
      </Section>
    </LegalPage>
  );
}
