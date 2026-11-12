import Link from 'next/link';
import { PhotoHero } from '@/components/layout/photo-hero';
import { BikeCards, Breadcrumbs, Card, FaqList, P, PickupCard, RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { breadcrumbJsonLd, faqJsonLd, getModelsSafe, JsonLd, pageMetadata } from '@/lib/seo';
import { ADVENTURE_SLUGS, adventureFaqs, DISCOUNT_LINE, PLACES } from '@/lib/seo-content';

export const revalidate = 300;

const PATH = '/adventure-bike-rental-dehradun';

export const metadata = pageMetadata({
  title: 'KTM, Triumph & Adventure Bikes on Rent in Dehradun | Valley Ride',
  absoluteTitle: true,
  description: 'Rent a KTM 390 Adventure X, Triumph Scrambler 400 X, V-Strom SX 250, XPulse 210 or Himalayan 450 in Dehradun for Chakrata, Chopta and Himalayan trips.',
  path: PATH,
  keywords: ['KTM on rent in Dehradun', 'KTM 390 Adventure rent Dehradun', 'Triumph on rent Dehradun', 'Triumph Scrambler 400 X rent', 'adventure bike rental Dehradun',
    'V-Strom SX 250 on rent', 'XPulse on rent Dehradun', 'bike rent for Chopta', 'Himalayan bike trip rental Uttarakhand', 'off-road bike rent Dehradun'],
});

const MATCH = [
  ['KTM 390 Adventure X', 'The most powerful bike in the fleet: 46 PS, WP suspension and 228 mm of clearance for Chakrata, Harsil, Chopta and the high passes. For experienced riders.', '/fleet/390-adventure-x'],
  ['Triumph Scrambler 400 X', 'Premium scrambler with a 19-inch front wheel and upside-down forks: Mussoorie, Dhanaulti and weekend hill rides with some broken road.', '/fleet/scrambler-400-x'],
  ['Royal Enfield Himalayan 450', 'Relaxed long-distance touring with 200 mm of travel and a 21-inch front wheel: Tehri, Nag Tibba and multi-day Garhwal loops.', '/fleet/himalayan-450'],
  ['Suzuki V-Strom SX 250', 'Light, comfortable and frugal tourer with a Bluetooth console: long days to Auli, Chopta or Dhanaulti, solo or two-up.', '/fleet/v-strom-sx-250'],
  ['Hero XPulse 210', 'The easiest off-roader: 21-inch spoked front wheel and 220 mm of clearance for Maldevta, river beds and dirt trails.', '/fleet/xpulse-210'],
] as const;

export default async function AdventureBikeRentalPage() {
  const models = await getModelsSafe();
  const faqs = adventureFaqs(models);
  return (
    <div className="pb-6">
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Bike rental in Dehradun', path: '/bike-rental-dehradun' }, { name: 'KTM, Triumph and adventure bikes', path: PATH }]), faqJsonLd(faqs)]} />
      <PhotoHero photo="offroad" position="30% center" minH={500}>
        <Breadcrumbs dark items={[{ name: 'Bike rental in Dehradun', path: '/bike-rental-dehradun' }, { name: 'KTM, Triumph and adventure bikes' }]} />
        <h1 className="m-0 max-w-[900px] text-[clamp(36px,5.5vw,68px)] font-normal leading-[1.05] tracking-[-1.2px]">KTM, Triumph and adventure bikes on rent in Dehradun</h1>
        <p className="m-0 max-w-[680px] text-[19px] leading-normal text-white/85">
          The KTM 390 Adventure X, Triumph Scrambler 400 X, Royal Enfield Himalayan 450, Suzuki V-Strom SX 250 and Hero XPulse 210, ready at Dorm Hub on
          Sahastradhara Road for Chakrata, Chopta, Harsil and the high Himalaya.
        </p>
        <div className="mt-2 flex flex-wrap gap-2.5">
          <Link href="/book" className="inline-flex h-12 items-center rounded-full bg-surface px-[22px] text-[15px] text-ink">Check availability</Link>
          <Link href="/fleet" className="glass inline-flex h-12 items-center rounded-full px-[22px] text-[15px]">Compare all bikes</Link>
        </div>
      </PhotoHero>

      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-12 sm:px-6">
        <section className="flex flex-col gap-5">
          <h2 className="m-0 text-[clamp(28px,5vw,36px)] font-normal tracking-[-0.5px]">Adventure and premium bikes for rent</h2>
          <BikeCards models={models} only={ADVENTURE_SLUGS} alt={(n) => `${n} on rent in Dehradun`} />
          <p className="m-0 text-[15px] text-muted">Prices include 18% GST. {DISCOUNT_LINE}</p>
        </section>

        <Card title="Which bike for which ride">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-3">
            {MATCH.map(([name, line, href]) => (
              <Link key={name} href={href} className="flex flex-col gap-1 rounded-card bg-field px-5 py-4"><span className="text-xl">{name}</span><span className="text-[15px] leading-normal text-body">{line}</span></Link>
            ))}
          </div>
          <P>
            All five have ABS and fuel injection, and each model page lists the full manufacturer specifications, real-world mileage and how it handles the
            city, hairpins, highway and broken roads. With luggage or a pillion on a long trip, choose the Himalayan 450, V-Strom SX 250 or KTM 390 Adventure X.
          </P>
        </Card>

        <Card title="Plan an adventure ride from Dehradun">
          <P>
            For a first taste of trail riding, head to the river beds past <Link href="/routes/maldevta" className="underline">Maldevta</Link>, 20 km east.
            Give Chakrata, Tehri or Nag Tibba two days, and Chopta, Tungnath, Harsil or Auli at least four. Each booking includes a daily km allowance, so
            check the extra-km rate when you plan a long route, and carry warm layers: it is much colder above 2,500 m.
          </P>
          <Link href="/places-to-visit-near-dehradun" className="self-start text-[15px] underline">Distances, ride times and the best season for {PLACES.reduce((n, g) => n + g.places.length, 0)} rides from Dehradun</Link>
        </Card>

        <PickupCard />
        <FaqList faqs={faqs} title="KTM, Triumph and adventure bike rental: common questions" />
        <RelatedLinks links={[SEO_LINKS.bikes, SEO_LINKS.enfield, SEO_LINKS.scooty, SEO_LINKS.places, SEO_LINKS.fleet, SEO_LINKS.faq]} />
      </main>
    </div>
  );
}
