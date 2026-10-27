import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/site-header';

export const metadata: Metadata = { title: 'Rental terms and privacy' };

/** Summary of the rules in the architecture document; the full legal text is owner-supplied. Same copy as the app. */
const SECTIONS = [
  ['Booking and payment', 'A bike is held for 15 minutes while you pay. Rental, GST and the refundable deposit are paid together through Razorpay.'],
  ['Cancellation', 'More than 24 hours before pickup, the full rental is refunded; within 24 hours, 50%. The deposit is always refunded.'],
  ['At pickup', 'Bring your original driving licence and an ID proof. Staff take photos of the bike with you, and you sign the rental agreement on your phone.'],
  ['On the ride', 'Each booking includes a km allowance. Extra km and late returns are charged per the rates shown when you booked, including GST. Helmets are compulsory for rider and pillion.'],
  ['Return and deposit', 'Damage found at return is charged from the deposit after inspection. The rest of the deposit goes back to the card or UPI you paid with.'],
  ['Your data', 'Document photos are stored privately on our server and are available to authorised staff for verification. We keep only the last 4 characters of the document number you enter. A photo may still show the full number; use a masked Aadhaar if you choose to upload Aadhaar.'],
];

export default function TermsPage() {
  return (
    <div className="pb-10">
      <SiteHeader />
      <main className="mx-auto flex max-w-[860px] flex-col gap-4 px-4 pt-10 sm:px-6">
        <h1 className="m-0 text-5xl font-normal tracking-[-0.8px]">Rental terms and privacy</h1>
        {SECTIONS.map(([h, p]) => (
          <section key={h} className="flex flex-col gap-2 rounded-card bg-surface p-7"><h2 className="m-0 text-2xl font-normal">{h}</h2><p className="m-0 text-[17px] leading-[1.6] text-body">{p}</p></section>
        ))}
        <p className="text-center text-sm text-muted">Prices, rates and terms are illustrative until reviewed for launch.</p>
      </main>
    </div>
  );
}
