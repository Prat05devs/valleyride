import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { Breadcrumbs, Card, FaqList, P, PickupCard, RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { BUSINESS, breadcrumbJsonLd, faqJsonLd, JsonLd, pageMetadata, type Faq } from '@/lib/seo';

const PATH = '/pickup-location';

export const metadata = pageMetadata({
  title: 'Bike Rental Pickup Point: Dorm Hub, Sahastradhara Road, Dehradun | Valley Ride',
  absoluteTitle: true,
  description: 'Valley Ride bikes and scooters are picked up and returned at Dorm Hub, 4th Floor, Sahastradhara Road, near Doon IT Park, Dehradun. Open every day, 8 AM to 8 PM. Map, directions and what to bring.',
  path: PATH,
  keywords: ['bike rent near IT Park Dehradun', 'bike rent Sahastradhara Road', 'scooty rent Sahastradhara Road', 'bike rental near Dorm Hub Dehradun', 'bike rental near me Dehradun', 'hostel bike rental Dehradun'],
});

const FAQS: Faq[] = [
  { q: 'Where is the Valley Ride pickup point?', a: 'Dorm Hub, 4th Floor, Sahastradhara Road, near Doon IT Park, Aman Vihar, Dehradun 248001. Search "Dorm Hub Dehradun" in Google Maps. Every Valley Ride bike is picked up and returned here.' },
  { q: 'What are the pickup and return hours?', a: 'Every day from 8 AM to 8 PM. Choose your pickup and return times when you book; the bike is ready for you at the time you picked.' },
  { q: 'How do I get to Dorm Hub from Dehradun ISBT or the railway station?', a: 'Take an auto, a cab or a bike taxi to Sahastradhara Road, near Doon IT Park, on the north-east side of the city. From Jolly Grant airport, a cab is the easiest option.' },
  { q: 'What should I bring at pickup?', a: 'Your original driving licence and the ID proof you uploaded when you booked. Staff check the documents, take pre-ride photos of the bike with you, and you sign the rental agreement on your phone.' },
];

export default function PickupLocationPage() {
  return (
    <div className="pb-6">
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Pickup point', path: PATH }]), faqJsonLd(FAQS)]} />
      <SiteHeader />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-8 sm:px-6">
        <Breadcrumbs items={[{ name: 'Pickup point' }]} />
        <h1 className="m-0 text-[clamp(36px,5vw,56px)] font-normal tracking-[-1px]">Pickup point: Dorm Hub, Sahastradhara Road, Dehradun</h1>
        <p className="m-0 max-w-[760px] text-[19px] leading-normal text-body">
          All Valley Ride scooters and Royal Enfield motorcycles are picked up and returned at Dorm Hub, near Doon IT Park on Sahastradhara Road.
          {` ${BUSINESS.pickup.hours.label}.`}
        </p>

        <PickupCard map />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-5">
          <Card title="Why Sahastradhara Road works well">
            <P>
              The pickup point is on the north-east side of Dehradun, away from the congestion around the Clock Tower and Paltan Bazaar. The springs at{' '}
              <Link href="/routes/sahastradhara-loop" className="underline">Sahastradhara</Link> are about 6 km up the same road, Maldevta and the Song river
              are a short ride south-east through Raipur, and Rajpur Road, where the climb to <Link href="/routes/dehradun-mussoorie" className="underline">Mussoorie</Link> begins, is a few kilometres west.
            </P>
            <P>Dorm Hub is a hostel, so backpackers staying there can step straight onto a bike.</P>
          </Card>
          <Card title="At pickup">
            <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-[17px] leading-[1.6] text-body">
              <li>Show your original driving licence and ID proof.</li>
              <li>Walk round the bike with our staff while we take pre-ride photos together.</li>
              <li>Sign the rental agreement on your phone and collect the keys.</li>
              <li>Bring it back to the same point by your return time. After inspection, the deposit goes back to your UPI or card.</li>
            </ol>
          </Card>
        </div>

        <FaqList faqs={FAQS} title="Pickup and return: common questions" />
        <RelatedLinks links={[SEO_LINKS.bikes, SEO_LINKS.scooty, SEO_LINKS.enfield, SEO_LINKS.places, SEO_LINKS.faq]} />
      </main>
    </div>
  );
}
