import Link from 'next/link';
import { PhotoHero } from '@/components/layout/photo-hero';
import { BikeCards, Breadcrumbs, Card, FaqList, P, PickupCard, RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { formatPaise } from '@/lib/format';
import { breadcrumbJsonLd, faqJsonLd, getModelsSafe, JsonLd, pageMetadata } from '@/lib/seo';
import { DISCOUNT_LINE, scootyFaqs } from '@/lib/seo-content';

export const revalidate = 300;

const PATH = '/scooty-rental-dehradun';

export const metadata = pageMetadata({
  title: 'Scooty on Rent in Dehradun · Activa 125 | Valley Ride',
  absoluteTitle: true,
  description: 'Rent a Honda Activa 125 scooty in Dehradun by the day or month. Easy for the city, Sahastradhara, Robbers Cave and Rishikesh. Pickup at Dorm Hub, Sahastradhara Road. GST included, deposit refunded.',
  path: PATH,
  keywords: ['scooty on rent in Dehradun', 'scooty rent Dehradun', 'scooter rental Dehradun', 'Activa on rent Dehradun', 'scooty rent near me Dehradun', 'monthly scooty rent Dehradun', 'scooty for Mussoorie'],
});

const CITY_RIDES = [
  ['Sahastradhara', 'About 6 km from Dorm Hub: sulphur springs and caves', '/routes/sahastradhara-loop'],
  ['Robbers Cave (Guchhupani)', 'About 8 km from the city centre: walk up a stream through a gorge', '/places-to-visit-near-dehradun#robbers-cave'],
  ['Forest Research Institute', 'About 7 km from the city centre: the red-brick landmark of Dehradun', '/places-to-visit-near-dehradun#fri'],
  ['Mindrolling Monastery', 'About 9 km south, in Clement Town', '/places-to-visit-near-dehradun#mindrolling'],
  ['Rishikesh', 'About 45 km on the forest highway', '/routes/dehradun-rishikesh'],
] as const;

export default async function ScootyRentalPage() {
  const models = await getModelsSafe();
  const activa = models.find((m) => m.slug === 'activa-125');
  const faqs = scootyFaqs(models);
  return (
    <div className="pb-6">
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Bike rental in Dehradun', path: '/bike-rental-dehradun' }, { name: 'Scooty on rent', path: PATH }]), faqJsonLd(faqs)]} />
      <PhotoHero position="center 55%" minH={500}>
        <Breadcrumbs dark items={[{ name: 'Bike rental in Dehradun', path: '/bike-rental-dehradun' }, { name: 'Scooty on rent' }]} />
        <h1 className="m-0 max-w-[820px] text-[clamp(40px,5.5vw,68px)] font-normal tracking-[-1.2px]">Scooty on rent in Dehradun</h1>
        <p className="m-0 max-w-[680px] text-[19px] leading-normal text-white/85">
          The Honda Activa 125: gearless, light and easy to park, for Dehradun city, the springs at Sahastradhara and the highway to Rishikesh.
          {activa && ` ${formatPaise(activa.pricePerDayPaise)} a day, GST included.`}
        </p>
        <div className="mt-2 flex flex-wrap gap-2.5">
          <Link href="/fleet/activa-125" className="inline-flex h-12 items-center rounded-full bg-surface px-[22px] text-[15px] text-ink">Book the Activa 125</Link>
          <Link href="/book" className="glass inline-flex h-12 items-center rounded-full px-[22px] text-[15px]">Check dates</Link>
        </div>
      </PhotoHero>

      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-12 sm:px-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-start gap-5">
          <BikeCards models={models} only={['activa-125']} alt={(n) => `${n} scooty on rent in Dehradun`} />
          <Card title="The Activa 125 for Dehradun">
            <P>
              Most of Dehradun is best seen on a scooter: short hops between cafés on Rajpur Road, a morning at Sahastradhara, an afternoon at
              FRI and Robbers Cave. The Activa 125 is gearless, so it suits first-time renters, couples, students and anyone travelling light.
            </P>
            <P>
              It is comfortable at 60–70 km/h on the highway to Rishikesh and manages the climb to Mussoorie with one rider. With a pillion in the
              hills, a <Link href="/royal-enfield-rental-dehradun" className="underline">Royal Enfield</Link> is the better choice.
            </P>
            {activa && <P>{activa.kmPerDay} km a day is included; after that it is {formatPaise(activa.extraKmPaise)} a km. The refundable deposit is {formatPaise(activa.depositPaise)}.</P>}
            <p className="m-0 text-[15px] text-muted">{DISCOUNT_LINE}</p>
          </Card>
        </div>

        <Card title="Scooty rides in and around Dehradun">
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3 p-0">
            {CITY_RIDES.map(([name, line, href]) => (
              <li key={name}><Link href={href} className="flex flex-col gap-0.5 rounded-card bg-field px-5 py-4"><span className="text-lg">{name}</span><span className="text-[15px] text-muted">{line}</span></Link></li>
            ))}
          </ul>
        </Card>

        <PickupCard />
        <FaqList faqs={faqs} title="Scooty rental in Dehradun: common questions" />
        <RelatedLinks links={[SEO_LINKS.bikes, SEO_LINKS.enfield, SEO_LINKS.places, SEO_LINKS.pickup, SEO_LINKS.faq, SEO_LINKS.hindi]} />
      </main>
    </div>
  );
}
