import Link from 'next/link';
import { PhotoHero } from '@/components/layout/photo-hero';
import { BikeCards, Breadcrumbs, Card, FaqList, P, PickupCard, RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { breadcrumbJsonLd, faqJsonLd, getModelsSafe, JsonLd, pageMetadata } from '@/lib/seo';
import { DISCOUNT_LINE, generalFaqs } from '@/lib/seo-content';

export const revalidate = 300;

const PATH = '/bike-rental-dehradun';

export const metadata = pageMetadata({
  title: 'Bike on Rent in Dehradun · Royal Enfield & Scooty | Valley Ride',
  absoluteTitle: true,
  description: 'Rent a bike in Dehradun by the day, week or month: Honda Activa 125, Royal Enfield Hunter 350, Scram 440 and Himalayan 450. Pickup at Dorm Hub, Sahastradhara Road. Prices include GST; deposit refunded on return.',
  path: PATH,
  keywords: ['bike on rent in Dehradun', 'bike rental Dehradun', 'bike rent Dehradun', 'two wheeler on rent Dehradun', 'rent a bike Dehradun', 'self drive bike Dehradun', 'bike rent near me Dehradun', 'bike rental Dehradun to Mussoorie'],
  languages: { 'en-IN': PATH, 'hi-IN': '/hi/bike-rental-dehradun' },
});

const RIDES = [
  ['Sahastradhara', 'About 6 km from Dorm Hub', '/places-to-visit-near-dehradun#sahastradhara'],
  ['Mussoorie and Landour', '33–35 km, 1.5–2 hours', '/routes/dehradun-mussoorie'],
  ['Rishikesh', 'About 45 km, 1.25–1.5 hours', '/routes/dehradun-rishikesh'],
  ['Kempty Falls', 'About 48 km via Mussoorie', '/places-to-visit-near-dehradun#kempty-falls'],
  ['Dhanaulti', 'About 60 km via Mussoorie', '/places-to-visit-near-dehradun#dhanaulti'],
  ['Chakrata', 'About 90 km via Kalsi', '/places-to-visit-near-dehradun#chakrata'],
] as const;

export default async function BikeRentalDehradunPage() {
  const models = await getModelsSafe();
  const faqs = generalFaqs(models).filter((_, i) => [0, 1, 2, 3, 6, 9].includes(i));
  return (
    <div className="pb-6">
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Bike rental in Dehradun', path: PATH }]), faqJsonLd(faqs)]} />
      <PhotoHero position="center 55%" minH={520}>
        <Breadcrumbs dark items={[{ name: 'Bike rental in Dehradun' }]} />
        <h1 className="m-0 max-w-[820px] text-[clamp(40px,5.5vw,68px)] font-normal tracking-[-1.2px]">Bike on rent in Dehradun</h1>
        <p className="m-0 max-w-[680px] text-[19px] leading-normal text-white/85">
          Rent a Honda Activa 125 or a Royal Enfield Hunter 350, Scram 440 or Himalayan 450 by the day, week or month. Pick it up at Dorm Hub on
          Sahastradhara Road, ride to Mussoorie, Rishikesh or Dhanaulti, and get your deposit back on return.
        </p>
        <div className="mt-2 flex flex-wrap gap-2.5">
          <Link href="/book" className="inline-flex h-12 items-center rounded-full bg-surface px-[22px] text-[15px] text-ink">Check availability</Link>
          <Link href="/fleet" className="glass inline-flex h-12 items-center rounded-full px-[22px] text-[15px]">See prices</Link>
        </div>
      </PhotoHero>

      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-12 sm:px-6">
        <section className="flex flex-col gap-5">
          <h2 className="m-0 text-[36px] font-normal tracking-[-0.5px]">Bikes and scooters for rent in Dehradun</h2>
          <BikeCards models={models} alt={(n) => `${n} on rent in Dehradun`} />
          <p className="m-0 text-[15px] text-muted">Prices include 18% GST. {DISCOUNT_LINE}</p>
        </section>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-5">
          <Card title="Why riders rent from Valley Ride">
            <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[17px] leading-[1.6] text-body">
              <li><strong className="font-medium">Live availability.</strong> See which bikes are free for your dates and book in a few minutes.</li>
              <li><strong className="font-medium">One clear price.</strong> The daily rent includes GST, with the km allowance and extra-km rate shown before you pay.</li>
              <li><strong className="font-medium">Digital pickup.</strong> Upload your licence before you arrive; at Dorm Hub we take pre-ride photos together and you sign on your phone.</li>
              <li><strong className="font-medium">Deposit back to your UPI or card</strong> after a quick inspection at return.</li>
              <li><strong className="font-medium">Bikes for the hills.</strong> A scooter for the city, Royal Enfields for Mussoorie, Chakrata and longer Himalayan rides.</li>
            </ul>
          </Card>
          <Card title="How to rent a bike in Dehradun">
            <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-[17px] leading-[1.6] text-body">
              <li>Choose your pickup and return times and a bike on <Link href="/book" className="underline">valleyride.in</Link> or in the Valley Ride app.</li>
              <li>Pay the rent and the refundable deposit by UPI or card. The bike is held for 15 minutes while you pay.</li>
              <li>Upload your driving licence and an ID proof in your account.</li>
              <li>Collect the bike at Dorm Hub, Sahastradhara Road, with the original documents.</li>
              <li>Return it to Dorm Hub. After the inspection, the deposit goes back to the UPI or card you paid with.</li>
            </ol>
          </Card>
        </div>

        <PickupCard />

        <Card title="Where to ride from Dehradun">
          <P>Dehradun is the gateway to the Garhwal hills. These are the rides our customers take most, with road distances from the city.</P>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3 p-0">
            {RIDES.map(([name, line, href]) => (
              <li key={name}><Link href={href} className="flex flex-col gap-0.5 rounded-card bg-field px-5 py-4"><span className="text-lg">{name}</span><span className="text-[15px] text-muted">{line}</span></Link></li>
            ))}
          </ul>
          <Link href="/places-to-visit-near-dehradun" className="self-start text-[15px] underline">All places to ride near Dehradun</Link>
        </Card>

        <FaqList faqs={faqs} title="Bike rental in Dehradun: common questions" />
        <RelatedLinks links={[SEO_LINKS.scooty, SEO_LINKS.enfield, SEO_LINKS.places, SEO_LINKS.mussoorie, SEO_LINKS.pickup, SEO_LINKS.faq, SEO_LINKS.hindi]} />
      </main>
    </div>
  );
}
