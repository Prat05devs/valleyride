import Link from 'next/link';
import { PhotoHero } from '@/components/layout/photo-hero';
import { BikeCards, Breadcrumbs, Card, FaqList, P, PickupCard, RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { breadcrumbJsonLd, faqJsonLd, getModelsSafe, JsonLd, pageMetadata } from '@/lib/seo';
import { DISCOUNT_LINE, enfieldFaqs, PLACES } from '@/lib/seo-content';

export const revalidate = 300;

const PATH = '/royal-enfield-rental-dehradun';

export const metadata = pageMetadata({
  title: 'Royal Enfield on Rent in Dehradun · Himalayan, Scram, Hunter | Valley Ride',
  absoluteTitle: true,
  description: 'Rent a Royal Enfield Himalayan 450, Scram 440 or Hunter 350 in Dehradun for Mussoorie, Chakrata, Tehri and Himalayan trips. Pickup at Dorm Hub, Sahastradhara Road. GST included, deposit refunded.',
  path: PATH,
  keywords: ['Royal Enfield on rent in Dehradun', 'Royal Enfield rental Dehradun', 'Bullet on rent Dehradun', 'Himalayan 450 on rent Dehradun', 'Hunter 350 on rent Dehradun', 'Scram 440 rent Dehradun', 'bike rent for Uttarakhand trip'],
});

const MATCH = [
  ['Hunter 350', 'Mussoorie, Landour, Dhanaulti and Rishikesh, solo or with a pillion. Light, quick to turn in narrow lanes.', '/fleet/hunter-350'],
  ['Scram 440', 'Mixed roads and broken patches: Mussoorie, Kempty, Maldevta and weekend rides over the ridge to Kanatal.', '/fleet/scram-440'],
  ['Himalayan 450', 'Long-distance touring and adventure: Chakrata, Tehri, Nag Tibba and multi-day trips to Chopta.', '/fleet/himalayan-450'],
] as const;

export default async function RoyalEnfieldRentalPage() {
  const models = await getModelsSafe();
  const faqs = enfieldFaqs(models);
  return (
    <div className="pb-6">
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Bike rental in Dehradun', path: '/bike-rental-dehradun' }, { name: 'Royal Enfield on rent', path: PATH }]), faqJsonLd(faqs)]} />
      <PhotoHero photo="welcome" position="center 45%" minH={500}>
        <Breadcrumbs dark items={[{ name: 'Bike rental in Dehradun', path: '/bike-rental-dehradun' }, { name: 'Royal Enfield on rent' }]} />
        <h1 className="m-0 max-w-[860px] text-[clamp(40px,5.5vw,68px)] font-normal tracking-[-1.2px]">Royal Enfield on rent in Dehradun</h1>
        <p className="m-0 max-w-[680px] text-[19px] leading-normal text-white/85">
          The Hunter 350, Scram 440 and Himalayan 450, ready at Dorm Hub on Sahastradhara Road for Mussoorie, Chakrata, Tehri and longer rides into the Garhwal Himalaya.
        </p>
        <div className="mt-2 flex flex-wrap gap-2.5">
          <Link href="/book" className="inline-flex h-12 items-center rounded-full bg-surface px-[22px] text-[15px] text-ink">Check availability</Link>
          <Link href="/fleet" className="glass inline-flex h-12 items-center rounded-full px-[22px] text-[15px]">Compare bikes</Link>
        </div>
      </PhotoHero>

      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-12 sm:px-6">
        <section className="flex flex-col gap-5">
          <h2 className="m-0 text-[36px] font-normal tracking-[-0.5px]">Royal Enfield bikes for rent</h2>
          <BikeCards models={models} only={['hunter-350', 'scram-440', 'himalayan-450']} alt={(n) => `${n} on rent in Dehradun`} />
          <p className="m-0 text-[15px] text-muted">Prices include 18% GST. {DISCOUNT_LINE}</p>
        </section>

        <Card title="Which Royal Enfield for which ride">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-3">
            {MATCH.map(([name, line, href]) => (
              <Link key={name} href={href} className="flex flex-col gap-1 rounded-card bg-field px-5 py-4"><span className="text-xl">{name}</span><span className="text-[15px] leading-normal text-body">{line}</span></Link>
            ))}
          </div>
          <P>
            All three are fuel-injected, with ABS and enough low-down pull for the hairpins above Kolhukhet on the way to Mussoorie. With a pillion
            or luggage in the hills, any of them is a better choice than a scooter.
          </P>
        </Card>

        <Card title="Plan a Royal Enfield trip from Dehradun">
          <P>
            A day is enough for <Link href="/routes/dehradun-mussoorie" className="underline">Mussoorie and Landour</Link> or for Kempty Falls. Make Dhanaulti and
            Kanatal an overnight trip, and give Chakrata, Tehri or Nag Tibba two days. For Chopta and Tungnath, plan at least four.
            Each booking includes a daily km allowance, so check the extra-km rate when you plan a long route.
          </P>
          <Link href="/places-to-visit-near-dehradun" className="self-start text-[15px] underline">Distances, ride times and the best season for {PLACES.reduce((n, g) => n + g.places.length, 0)} rides from Dehradun</Link>
        </Card>

        <PickupCard />
        <FaqList faqs={faqs} title="Royal Enfield rental in Dehradun: common questions" />
        <RelatedLinks links={[SEO_LINKS.bikes, SEO_LINKS.scooty, SEO_LINKS.places, SEO_LINKS.mussoorie, SEO_LINKS.pickup, SEO_LINKS.faq]} />
      </main>
    </div>
  );
}
