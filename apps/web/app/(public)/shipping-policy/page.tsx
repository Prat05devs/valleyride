import type { Metadata } from 'next';
import { ADDRESS_LINE, BUSINESS, pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { formatOpenHours, type LocationDTO } from '@valleyride/shared';
import { LegalPage, List, Section } from '@/components/legal/legal-page';
import { api } from '@/lib/api-client';

export const metadata: Metadata = pageMetadata({
  title: 'Pickup and delivery policy',
  description: 'How Valley Ride delivers a rental: confirmation, the Dorm Hub pickup point in Dehradun, timing and return.',
  path: '/shipping-policy',
});

/** Payment gateways ask for a shipping and delivery policy; for a rental, delivery is the handover at a pickup point. */
export default async function ShippingPolicyPage() {
  const locations = await api.get<LocationDTO[]>('/locations', { next: { revalidate: 3600 } }).catch(() => [] as LocationDTO[]);
  return (
    <LegalPage
      title="Pickup and delivery policy"
      path="/shipping-policy"
      intro={<p>Valley Ride rents vehicles. We do not ship physical goods. Your rental is delivered when you collect the vehicle at our pickup point, at the date and time you booked.</p>}
    >
      <Section title="Confirmation">
        <p>As soon as Razorpay confirms your payment, the booking is confirmed. You see it in the app under <strong>Trips</strong> and on the website in <Link href="/account/bookings">My bookings</Link>, with a booking code, the pickup point and directions. You also get a notification on your phone. Your GST invoice is available in the same place.</p>
      </Section>

      <Section title="Pickup point">
        {locations.length > 0 ? (
          <List items={locations.map((l) => <><strong>{l.name}</strong>. {l.address}{formatOpenHours(l.openHours) ? `. ${formatOpenHours(l.openHours)}` : ''}</>)} />
        ) : <p><strong>Dorm Hub, Dehradun</strong>. {ADDRESS_LINE}. {BUSINESS.pickup.hours.label}.</p>}
        <p>Bring your original driving licence and an ID proof. The handover, which includes vehicle photos, a checklist and signing the agreement on your phone, usually takes about 10 minutes.</p>
      </Section>

      <Section title="Timing">
        <List items={[
          'Collect the vehicle at your booked pickup time, during desk hours. If you will be late, call or WhatsApp us, and we will keep the vehicle for you for the day of your booking.',
          'If we cannot hand over the vehicle you booked, we offer a similar vehicle or a full refund. See the cancellation and refund policy.',
          'Doorstep delivery is not offered at present.',
        ]} />
      </Section>

      <Section title="Return">
        <p>Return the vehicle to the point you collected it from, by the end time on your booking. The deposit is settled after the return inspection, as described in the <Link href="/refund-policy">cancellation and refund policy</Link>.</p>
      </Section>
    </LegalPage>
  );
}
