import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, List, Section } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What personal data Valley Ride collects in its app and website, why, who it is shared with, and your rights.',
};

/** Describes what the API, website and app actually store; keep in step with the models and integrations. */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      path="/privacy"
      intro={<p>Valley Ride rents scooters and motorcycles in Dehradun, Mussoorie and Rishikesh through the Valley Ride app and valleyride.in. This policy explains what personal data we collect, why we need it, who we share it with and the choices you have. It applies to the app on iPhone and Android, this website and our pickup desks. We process your data under India&apos;s Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.</p>}
    >
      <Section title="What we collect">
        <p><strong>Your account.</strong> Your mobile number, which is also your login, and your password. We store only a salted hash of the password, never the password itself. If you add them, we also keep your name and email address.</p>
        <p><strong>Licence and ID documents.</strong> Indian law requires us to check a valid driving licence before handing over a vehicle. You upload photos of your driving licence and an ID proof. We record the document type and only the last 4 characters of the number you type in. The photo itself may show the full number. If you choose to upload Aadhaar, please use a masked Aadhaar.</p>
        <p><strong>Bookings.</strong> The bike, pickup and return points, dates and times, prices, discounts, coupon codes and booking status.</p>
        <p><strong>Payments.</strong> Razorpay processes your payments. We receive the order and payment reference, the amount, the method type and the status. We never see or store your full card number, CVV, UPI PIN or net-banking password.</p>
        <p><strong>Pickup and return.</strong> Odometer and fuel readings, photos of the vehicle (you may appear in them), notes on damage, your signature on the rental agreement and the emergency contact you give us. Only give an emergency contact&apos;s details with their permission.</p>
        <p><strong>Reviews</strong> you choose to leave after a trip.</p>
        <p><strong>Device and technical data.</strong> A push-notification token and your phone&apos;s platform (iOS or Android), so we can send trip updates. We also collect the IP address of requests that change bookings, documents or payments, which we keep for security and audit, and basic diagnostic logs if the app or website errors.</p>
        <p><strong>Valley Ride Capital</strong> (investors only). Your PAN, stored masked, a reference to your bank account, your investment amounts and terms, and signed agreements.</p>
        <p>We do <strong>not</strong> collect your GPS location, contacts, call logs, SMS or advertising identifier. The app uses the camera and photo library only when you choose to photograph or upload a document.</p>
      </Section>

      <Section title="Why we use it">
        <List items={[
          'To create your account and keep you signed in.',
          'To confirm, change, extend or cancel bookings, and to hand over and receive the vehicle.',
          'To verify your licence and identity before a rental, as the law requires and to prevent fraud.',
          'To take payments, issue GST invoices, and process refunds and deposit returns.',
          'To assess damage, extra kilometres and late returns at the end of a trip.',
          'To send booking, payment and trip notifications, and to answer your support requests.',
          'To keep the service secure, investigate misuse and meet our legal and tax obligations.',
        ]} />
        <p>We do not use your data for advertising, and we do not sell or rent it to anyone.</p>
      </Section>

      <Section title="Who we share it with">
        <List items={[
          <><strong>Razorpay</strong>, to process payments and refunds, under <a href="https://razorpay.com/privacy/" rel="noopener noreferrer">Razorpay&apos;s privacy policy</a>.</>,
          <><strong>Apple and Google</strong>, through Expo&apos;s push service, to deliver notifications to your phone.</>,
          <><strong>Hosting providers.</strong> Our servers run with DigitalOcean in Bengaluru, India, and the website is hosted by Hostinger. They store or carry data for us and may not use it for anything else.</>,
          <><strong>Our staff</strong> at the pickup desks and in operations, who see what they need to verify documents and hand over vehicles.</>,
          <><strong>Authorities and insurers</strong>, when the law requires it: for example the police or the transport department for a traffic violation, an accident or a stolen vehicle, or an insurer handling a claim.</>,
        ]} />
      </Section>

      <Section title="How we protect it">
        <p>All traffic between the app or website and our servers is encrypted (HTTPS). Document photos and signed agreements are stored privately on our servers in India. Only signed-in staff can open them, and each review is logged. On your phone, the app keeps your session in the iOS Keychain or Android Keystore. On the website it uses secure, HTTP-only cookies.</p>
      </Section>

      <Section title="How long we keep it">
        <p>We keep your account data while your account is open. When you <Link href="/delete-account">delete your account</Link>, we delete or anonymise your personal data within 30 days, with two exceptions:</p>
        <List items={[
          'invoices, payment and refund records, which tax law requires us to keep for up to 8 years;',
          'records tied to an open booking, an unpaid amount, a damage or insurance claim, or a legal request, which we keep until it is resolved.',
        ]} />
      </Section>

      <Section title="Your rights">
        <p>You can ask us to show you the personal data we hold about you, correct it, or delete it. You can also withdraw your consent, or nominate someone to act for you if you cannot. You can edit your name and email in the app at any time. For anything else, contact us using the details below. We reply within 30 days. If you are not satisfied with our response, you can complain to the Data Protection Board of India.</p>
      </Section>

      <Section title="Cookies">
        <p>The website uses only the cookies it needs to keep you signed in (<code>vr_access</code> and <code>vr_refresh</code>). While you pay, your browser&apos;s session storage briefly remembers your booking attempt. We do not use advertising or analytics cookies.</p>
      </Section>

      <Section title="Children">
        <p>You must be at least 18 years old and hold a valid driving licence to create an account or rent a vehicle. We do not knowingly collect data from children.</p>
      </Section>

      <Section title="Changes and grievance officer">
        <p>If this policy changes, we will update the date at the top of this page. If the changes are significant, we will also tell you in the app. Questions, requests and complaints about your data go to our Grievance Officer, using the contact details below.</p>
      </Section>
    </LegalPage>
  );
}
