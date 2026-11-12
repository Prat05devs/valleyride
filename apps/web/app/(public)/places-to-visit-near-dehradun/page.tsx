import Link from 'next/link';
import { PhotoHero } from '@/components/layout/photo-hero';
import { Breadcrumbs, Card, FaqList, P, PickupCard, PlaceCard, RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { abs, breadcrumbJsonLd, faqJsonLd, JsonLd, pageMetadata, type Faq } from '@/lib/seo';
import { PLACES } from '@/lib/seo-content';

const PATH = '/places-to-visit-near-dehradun';
const COUNT = PLACES.reduce((n, g) => n + g.places.length, 0);

export const metadata = pageMetadata({
  title: `Places to Visit Near Dehradun by Bike: ${COUNT} Rides and Day Trips | Valley Ride`,
  absoluteTitle: true,
  description: 'Mussoorie, Landour, Kempty Falls, Sahastradhara, Rishikesh, Dhanaulti, Chakrata, Tehri and Chopta by bike from Dehradun: distances, ride times, the right bike and the best season for each.',
  path: PATH,
  keywords: ['places to visit near Dehradun', 'places to visit in Dehradun', 'Dehradun to Mussoorie by bike', 'Uttarakhand bike trip', 'weekend trip from Dehradun', 'hill stations near Dehradun', 'Dhanaulti by bike', 'Chakrata bike ride', 'Kempty Falls from Dehradun'],
});

const FAQS: Faq[] = [
  { q: 'What are the best places to visit near Dehradun by bike?', a: 'The most popular rides from Dehradun are Mussoorie and Landour (33–35 km), Kempty Falls (about 48 km), Sahastradhara (14 km), Rishikesh (about 45 km), Dhanaulti (about 60 km) and Chakrata (about 90 km). For longer trips, riders go on to Tehri Lake, Nag Tibba and Chopta.' },
  { q: 'Which hill station is closest to Dehradun?', a: 'Mussoorie, 33–35 km and 1.5 to 2 hours by bike from Dehradun. Landour is just above it, and Dhanaulti is about 25 km further east along the ridge.' },
  { q: 'What is a good weekend bike trip from Dehradun?', a: 'Ride Dehradun to Mussoorie, Dhanaulti and Kanatal and stay the night, or take the hairpins after Kalsi up to Chakrata and Tiger Falls. Both suit a Royal Enfield Scram 440 or Himalayan 450.' },
  { q: 'What is the best season for a bike trip in Uttarakhand?', a: 'October to June. October to February has the clearest Himalayan views but icy mornings in the hills; March to June is warm in Dehradun and pleasant on the ridges. Avoid long hill rides in the July to September monsoon, when landslides can close roads.' },
];

function placesJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Places to visit near Dehradun by bike',
    itemListElement: PLACES.flatMap((g) => g.places).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: abs(`${PATH}#${p.id}`),
      item: { '@type': 'TouristDestination', name: p.name, description: p.blurb, url: abs(`${PATH}#${p.id}`) },
    })),
  };
}

export default function PlacesNearDehradunPage() {
  return (
    <div className="pb-6">
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Places to ride from Dehradun', path: PATH }]), placesJsonLd(), faqJsonLd(FAQS)]} />
      <PhotoHero photo="touring" position="35% center" minH={500}>
        <Breadcrumbs dark items={[{ name: 'Places to ride from Dehradun' }]} />
        <h1 className="m-0 max-w-[900px] text-[clamp(40px,5.5vw,68px)] font-normal tracking-[-1.2px]">Places to visit near Dehradun by bike</h1>
        <p className="m-0 max-w-[700px] text-[19px] leading-normal text-white/85">
          {COUNT} rides from Dehradun, from a 20-minute hop to Sahastradhara to a Himalayan trip to Chopta. Distances, ride times, the right bike and the best season for each.
        </p>
      </PhotoHero>

      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-12 sm:px-6">
        <Card title="Plan your ride">
          <P>
            Distances are approximate road distances from Dehradun city centre. All Valley Ride bikes start and finish at Dorm Hub on Sahastradhara Road,
            on the north-east side of the city. Check the weather and road conditions on the day, especially in the monsoon and in winter.
          </P>
          <nav aria-label="On this page" className="flex flex-wrap gap-2">
            {PLACES.flatMap((g) => g.places).map((p) => <a key={p.id} href={`#${p.id}`} className="inline-flex h-10 items-center rounded-full bg-field px-4 text-[15px]">{p.name}</a>)}
          </nav>
        </Card>

        {PLACES.map((g) => (
          <section key={g.group} className="flex flex-col gap-4 pt-4">
            <div className="px-2"><h2 className="m-0 text-[32px] font-normal tracking-[-0.4px]">{g.group}</h2><p className="m-0 mt-1.5 text-lg text-muted">{g.intro}</p></div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(380px,100%),1fr))] gap-4">
              {g.places.map((p) => <PlaceCard key={p.id} place={p} />)}
            </div>
          </section>
        ))}

        <Card title="Which bike to rent">
          <P>
            For Dehradun city, Sahastradhara, Robbers Cave and Rishikesh, the <Link href="/scooty-rental-dehradun" className="underline">Honda Activa 125</Link> is
            all you need. For Mussoorie and Dhanaulti, especially with a pillion, take a <Link href="/fleet/hunter-350" className="underline">Hunter 350</Link> or{' '}
            <Link href="/fleet/scram-440" className="underline">Scram 440</Link>. For Chakrata, Tehri, Nag Tibba and Chopta, the{' '}
            <Link href="/fleet/himalayan-450" className="underline">Himalayan 450</Link>,{' '}
            <Link href="/fleet/390-adventure-x" className="underline">KTM 390 Adventure X</Link> and{' '}
            <Link href="/fleet/v-strom-sx-250" className="underline">V-Strom SX 250</Link> are built for it; for dirt trails, the{' '}
            <Link href="/fleet/xpulse-210" className="underline">XPulse 210</Link>.
          </P>
        </Card>

        <PickupCard />
        <FaqList faqs={FAQS} title="Riding from Dehradun: common questions" />
        <p className="m-0 px-2 text-sm text-muted">Opening hours, road conditions and entry rules change with the season. Check locally before you set off.</p>
        <RelatedLinks links={[SEO_LINKS.mussoorie, SEO_LINKS.rishikesh, SEO_LINKS.bikes, SEO_LINKS.enfield, SEO_LINKS.scooty, SEO_LINKS.faq]} />
      </main>
    </div>
  );
}
