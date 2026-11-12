import type { Metadata } from 'next';
import { ADDRESS_LINE, BUSINESS, pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { formatOpenHours, type LocationDTO } from '@valleyride/shared';
import { LegalPage, List, Section } from '@/components/legal/legal-page';
import { api } from '@/lib/api-client';
import { DESK_HOURS, INSTAGRAM_HANDLE, INSTAGRAM_URL, PHONE_DISPLAY, SUPPORT_EMAIL, TEL_URL, WHATSAPP_URL } from '@/lib/legal';

export const metadata: Metadata = pageMetadata({
  title: 'Contact and support',
  description: 'Reach Valley Ride by phone or WhatsApp, find our pickup point at Dorm Hub, Sahastradhara Road, Dehradun, and get help with bookings, payments and the app.',
  path: '/contact',
});

/** The support URL for the App Store and Google Play listings. */
export default async function ContactPage() {
  const locations = await api.get<LocationDTO[]>('/locations', { next: { revalidate: 3600 } }).catch(() => [] as LocationDTO[]);
  return (
    <LegalPage
      title="Contact and support"
      path="/contact"
      intro={<p>We help with bookings, payments, refunds, documents and anything on the road. Have your booking code ready if your question is about a trip; it is shown in the app under Trips.</p>}
    >
      <Section title="Call or WhatsApp">
        <p className="!text-2xl text-ink"><a href={TEL_URL} className="!no-underline">{PHONE_DISPLAY}</a></p>
        <div className="flex flex-wrap gap-3">
          <a href={WHATSAPP_URL} className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-surface !no-underline">Message on WhatsApp</a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer me" className="inline-flex h-12 items-center rounded-full border border-line px-6 !no-underline">Instagram {INSTAGRAM_HANDLE}</a>
          <a href={TEL_URL} className="inline-flex h-12 items-center rounded-full border border-line px-6 !text-ink !no-underline">Call the desk</a>
        </div>
        <p>Desk hours: {DESK_HOURS}. During a rental, call us any time for a breakdown, accident or theft.</p>
        {SUPPORT_EMAIL && <p>Email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>}
      </Section>

      <Section title={locations.length > 1 ? 'Pickup points' : 'Pickup point'}>
        {locations.length > 0
          ? <List items={locations.map((l) => <><strong>{l.name}</strong>. {l.address}{formatOpenHours(l.openHours) ? `. ${formatOpenHours(l.openHours)}` : ''}</>)} />
          : <p><strong>Dorm Hub, Dehradun</strong>. {ADDRESS_LINE}. {BUSINESS.pickup.hours.label}.</p>}
        <p><a href={BUSINESS.pickup.mapUrl} target="_blank" rel="noreferrer">Open in Google Maps</a></p>
      </Section>

      <Section title="Quick help">
        <List items={[
          <>Cancel or change a booking: in the app under <strong>Trips</strong>, or in <Link href="/account/bookings">My bookings</Link>. See the <Link href="/refund-policy">cancellation and refund policy</Link>.</>,
          <>Forgot your password: WhatsApp us from your registered number, and we will verify it and set a temporary password.</>,
          <>Payment taken but booking not confirmed: wait 2 minutes and refresh Trips. If it is still pending, send us your booking code and we will check it with Razorpay.</>,
          <>Your data: read the <Link href="/privacy">privacy policy</Link>, or <Link href="/delete-account">delete your account</Link>.</>,
        ]} />
      </Section>
    </LegalPage>
  );
}
