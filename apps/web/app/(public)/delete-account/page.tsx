import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, List, Section } from '@/components/legal/legal-page';
import { PHONE_DISPLAY, WHATSAPP_URL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Delete your Valley Ride account',
  description: 'How to delete your Valley Ride account and personal data, and what we keep by law.',
};

/** The account-deletion URL for the Google Play data safety form. */
export default function DeleteAccountPage() {
  const message = encodeURIComponent('Please delete my Valley Ride account. My registered mobile number is: ');
  return (
    <LegalPage
      title="Delete your Valley Ride account"
      path="/delete-account"
      intro={<p>You can delete your Valley Ride account, and the personal data linked to it, at any time. This applies to accounts made in the Valley Ride app on iPhone or Android and on valleyride.in.</p>}
    >
      <Section title="How to request deletion">
        <List items={[
          <>Send a WhatsApp message to <a href={`${WHATSAPP_URL}?text=${message}`}>{PHONE_DISPLAY}</a> <strong>from the mobile number you registered with</strong>, saying &quot;Please delete my Valley Ride account&quot;. You can also call the same number.</>,
          'We confirm the request from that number. If you message from another number, we ask you to confirm from the registered one, so nobody else can delete your account.',
          'We delete your account within 30 days and confirm on WhatsApp when it is done. You are logged out on every device.',
        ]} />
        <p>If you have an upcoming or active trip, finish or <Link href="/refund-policy">cancel</Link> it first. An account with an unpaid amount is deleted once that is settled.</p>
      </Section>

      <Section title="What we delete">
        <List items={[
          'your name, email address and password;',
          'your driving licence and ID photos and their details;',
          'pickup and return photos, signatures and emergency contacts;',
          'your reviews and push-notification tokens.',
        ]} />
      </Section>

      <Section title="What we keep, and for how long">
        <p>Indian tax law requires us to keep invoices and payment and refund records for up to 8 years. We keep these with your mobile number, and use them only for tax, accounting and legal purposes. Records tied to an open dispute, a damage or insurance claim, or a legal request are kept until it is resolved, then deleted. Investors in Valley Ride Capital: agreements and repayment records are kept for the term of the investment and the period the law requires.</p>
        <p>Read more in our <Link href="/privacy">privacy policy</Link>.</p>
      </Section>
    </LegalPage>
  );
}
