import Link from 'next/link';
import type { LocationDTO } from '@valleyride/shared';
import { RouteArt } from '@/components/brand/art';
import { SearchForm } from '@/components/booking/search-form';
import { HeroSlideCaption, HeroSlideshow, type HeroSlide } from '@/components/layout/hero-slideshow';
import { SiteHeader } from '@/components/layout/site-header';
import { api, mediaUrl } from '@/lib/api-client';
import { BIKE_COPY, bikePhoto, shortName } from '@/lib/bikes';
import { countWord, formatPaise } from '@/lib/format';
import { ROUTE_META, routeLine } from '@/lib/routes';
import { FaqList, PickupCard, RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { faqJsonLd, getModelsSafe, getRoutesSafe, JsonLd, pageMetadata } from '@/lib/seo';
import { generalFaqs } from '@/lib/seo-content';
import { defaultWindow } from '@/lib/when';

export const revalidate = 300;

export const metadata = pageMetadata({
  title: 'Bike & Scooty on Rent in Dehradun | Valley Ride',
  absoluteTitle: true,
  description: 'Rent a scooty, Royal Enfield, KTM or Triumph in Dehradun: Activa 125, Hunter 350, Himalayan 450, KTM 390 Adventure X, Scrambler 400 X, XPulse 210 and more for Mussoorie, Rishikesh and Uttarakhand rides. Pickup at Dorm Hub, Sahastradhara Road. GST included.',
  path: '/',
  keywords: ['bike on rent in Dehradun', 'scooty on rent in Dehradun', 'bike rental Dehradun', 'Royal Enfield on rent Dehradun', 'Activa on rent Dehradun', 'bike rent for Mussoorie', 'two wheeler rental Dehradun', 'Valley Ride'],
});

/**
 * Hero photos, one per kind of ride (the grouping used on the bike cards); see docs/HERO-IMAGES.md for how they were
 * made and how to add one. Each is in public/images/hero at 1280, 1920 and 2560 px wide (WebP).
 */
const HERO_SLIDES: HeroSlide[] = [
  { base: '/images/hero/hero-city', kicker: 'City rides', title: 'Doon after dark', bikes: 'Honda Activa 125 · Royal Enfield Hunter 350', href: '/scooty-rental-dehradun',
    alt: 'A Honda Activa 125 scooty and a Royal Enfield Hunter 350 on rent, parked on Mall Road, Mussoorie, on a rainy evening', position: '64% center' },
  { base: '/images/hero/hero-weekend', kicker: 'Weekend hill rides', title: 'Above the clouds', bikes: 'Royal Enfield Scram 440 · Triumph Scrambler 400 X', href: '/fleet/scrambler-400-x',
    alt: 'A Royal Enfield Scram 440 and a Triumph Scrambler 400 X at a hill-road bend above a sea of clouds near Mussoorie at sunrise', position: '62% center' },
  { base: '/images/hero/hero-touring', kicker: 'Long tours', title: 'Road to the snow', bikes: 'Royal Enfield Himalayan 450 · Suzuki V-Strom SX 250', href: '/fleet/himalayan-450',
    alt: 'A Royal Enfield Himalayan 450 and a Suzuki V-Strom SX 250 with luggage on a Himalayan highway above the Bhagirathi valley, snow peaks behind', position: '46% center' },
  { base: '/images/hero/hero-offroad', kicker: 'Off-road', title: 'Dirt and water', bikes: 'KTM 390 Adventure X · Hero XPulse 210', href: '/fleet/390-adventure-x',
    alt: 'A KTM 390 Adventure X and a Hero XPulse 210 on a rocky stream trail in a deodar forest near Chakrata', position: '30% center' },
];

/** Static, so the page keeps useful, indexable content even while the API is unavailable. */
const NEARBY = [
  ['Sahastradhara', 'About 6 km from Dorm Hub', '/routes/sahastradhara-loop'],
  ['Mussoorie and Landour', '33–35 km · 1.5–2 h', '/routes/dehradun-mussoorie'],
  ['Kempty Falls', 'About 48 km via Mussoorie', '/places-to-visit-near-dehradun#kempty-falls'],
  ['Rishikesh', 'About 45 km · 1.25–1.5 h', '/routes/dehradun-rishikesh'],
  ['Dhanaulti', 'About 60 km via Mussoorie', '/places-to-visit-near-dehradun#dhanaulti'],
  ['Chakrata', 'About 90 km via Kalsi', '/places-to-visit-near-dehradun#chakrata'],
] as const;

const CATEGORY = { SCOOTER: 'Scooter', MOTORCYCLE: 'Motorcycle', ADVENTURE: 'Adventure' } as const;

export default async function HomePage() {
  const [models, locations, routes] = await Promise.all([
    getModelsSafe(),
    api.get<LocationDTO[]>('/locations', { next: { revalidate: 3600 } }).catch(() => [] as LocationDTO[]),
    getRoutesSafe(),
  ]);
  const units = models.reduce((s, m) => s + (m.units ?? 0), 0);
  const faqs = generalFaqs(models).filter((_, i) => [0, 1, 2, 4, 7, 13].includes(i));

  return (
    <div>
      <JsonLd data={faqJsonLd(faqs)} />
      <HeroSlideshow slides={HERO_SLIDES}>
        <SiteHeader variant="dark" />
        <div className="relative z-[3] mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-8 px-4 pb-14 sm:justify-end sm:px-6 sm:pt-10">
          {/* Phones: this block fills the rest of the first screen (header above is 68 px): headline at the top,
              the photo's caption and a jump to the search form at the bottom, the bikes visible in between. */}
          <div className="flex min-h-[calc(100svh-68px)] flex-col justify-between gap-6 pb-14 pt-4 sm:min-h-0 sm:pb-0 sm:pt-0 lg:flex-row lg:items-end">
            <div className="flex max-w-[720px] flex-col gap-3 sm:gap-4">
              <span className="text-[15px] text-white/85 sm:text-base">Dehradun · Mussoorie · Rishikesh</span>
              <h1 className="m-0 text-[clamp(36px,6vw,72px)] font-normal leading-[1.04] tracking-[-1.2px] sm:tracking-[-1.5px]">Rent a bike in Dehradun. Ride into the Himalayas.</h1>
              <p className="m-0 hidden max-w-[600px] text-xl leading-normal text-white/85 sm:block">Scooty for the city; Royal Enfield, KTM, Triumph, Suzuki and Hero bikes for the hills. Pick up at Dorm Hub, Sahastradhara Road, with live availability, prices including GST and your deposit refunded on return.</p>
            </div>
            <div className="flex flex-col gap-3 sm:contents">
              <HeroSlideCaption className="lg:self-end" />
              <a href="#hero-search" className="inline-flex h-[52px] items-center justify-center rounded-full bg-surface text-[17px] text-ink sm:hidden">Check availability</a>
            </div>
          </div>
          <div id="hero-search" className="scroll-mt-[160px]">
            <SearchForm locations={locations} initial={{ pickup: locations[0]?.id ?? '', returnTo: '', ...defaultWindow() }} />
          </div>
        </div>
      </HeroSlideshow>

      {models.length > 0 && <section className="mx-auto flex max-w-[1280px] flex-col gap-7 px-4 pt-24 sm:px-6">
        <Heading title="Bikes and scooty on rent" sub={`${units} bikes across ${countWord(models.length)} models. Prices per day include 18% GST.`} href="/fleet" cta="See the full fleet" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4">
          {models.map((m) => (
            <Link key={m.id} href={`/fleet/${m.slug}`} className="flex flex-col gap-3 rounded-sheet bg-surface px-[22px] pb-6 pt-5 transition-transform hover:-translate-y-0.5">
              <span className="inline-flex h-[30px] items-center self-start rounded-full bg-field px-3 text-sm">{CATEGORY[m.category]} · {BIKE_COPY[m.slug]?.tag}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bikePhoto(m)} alt={`${m.name} on rent in Dehradun`} loading="lazy" className="h-[190px] w-full object-contain" />
              <div className="flex items-baseline justify-between"><span className="text-[22px]">{shortName(m.name)}</span><span className="text-2xl font-medium">{formatPaise(m.pricePerDayPaise)}<span className="text-[15px] font-normal text-muted">/day</span></span></div>
              <span className="text-[15px] text-muted">{m.kmPerDay} km/day · {formatPaise(m.depositPaise)} deposit</span>
            </Link>
          ))}
        </div>
      </section>}

      <section className="mx-auto max-w-[1280px] px-4 pt-24 sm:px-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-8 rounded-[40px] bg-dark p-8 text-surface sm:p-12">
          <div className="flex flex-col gap-2.5"><h2 className="m-0 text-4xl font-normal tracking-[-0.5px]">How it works</h2><p className="m-0 text-[17px] leading-normal text-white/80">No paperwork at the desk. Everything is done on your phone.</p></div>
          {[
            ['Book and pay', 'See real availability, pay rental and deposit by UPI or card. Your bike is held while you pay.'],
            ['Digital pickup', 'We check your licence, take pre-ride photos together and you sign the agreement on your phone.'],
            ['Return, get your deposit', 'After a quick inspection the deposit is refunded to the card or UPI you paid with.'],
          ].map(([t, d], i) => (
            <div key={t} className="flex flex-col gap-2.5">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-medium ${i === 0 ? 'bg-orange text-ink' : 'bg-white/[0.14]'}`}>{i + 1}</span>
              <span className="text-xl">{t}</span><span className="text-base leading-normal text-white/80">{d}</span>
            </div>
          ))}
        </div>
      </section>

      {routes.length > 0 && (
        <section className="mx-auto flex max-w-[1280px] flex-col gap-7 px-4 pt-24 sm:px-6">
          <Heading title="Popular rides from Dehradun" sub="Route guides our team knows well, with the right bike for each." href="/routes" cta="All route guides" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4">
            {routes.map((r) => (
              <Link key={r.id} href={`/routes/${r.slug}`} className="flex flex-col gap-2 rounded-card bg-surface px-5 pb-[22px] pt-[18px]">
                {r.mapImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={mediaUrl(r.mapImage)} alt="" loading="lazy" className="h-[150px] w-full rounded-[20px] bg-field object-cover" />
                  : <RouteArt kind={ROUTE_META[r.slug]?.kind ?? 'climb'} height={110} />}
                <span className="text-xl">{r.title}</span>
                <span className="text-[15px] text-muted">{routeLine(r.slug, r.distanceKm)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1280px] px-4 pt-24 sm:px-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] items-start gap-6 rounded-[40px] bg-surface p-8 sm:p-10">
          <div className="flex flex-col gap-2"><h2 className="m-0 text-[32px] font-normal tracking-[-0.4px]">Clear pricing</h2><p className="m-0 text-base leading-normal text-muted">What you see at checkout is what you pay. Prices include 18% GST.</p></div>
          <Fact big="10–35% off" small="10% from 3 days, 20% from 7, 35% from 28" />
          <Fact big="Dorm Hub" small="pickup and return, Sahastradhara Road, Dehradun" />
          <Fact big="Refundable" small="deposit, returned after inspection" />
        </div>
      </section>

      <section className="mx-auto flex max-w-[1280px] flex-col gap-7 px-4 pt-24 sm:px-6">
        <Heading title="Where to ride from Dehradun" sub="Road distances from the city, from a half-day hop to a weekend in the hills." href="/places-to-visit-near-dehradun" cta="All places to ride" />
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3 p-0">
          {NEARBY.map(([name, line, href]) => (
            <li key={name}><Link href={href} className="flex flex-col gap-0.5 rounded-card bg-surface px-5 py-4"><span className="text-xl">{name}</span><span className="text-[15px] text-muted">{line}</span></Link></li>
          ))}
        </ul>
      </section>

      <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-24 sm:px-6">
        <PickupCard />
        <FaqList faqs={faqs} title="Renting a bike in Dehradun: quick answers" />
        <RelatedLinks links={[SEO_LINKS.bikes, SEO_LINKS.scooty, SEO_LINKS.enfield, SEO_LINKS.places, SEO_LINKS.pickup, SEO_LINKS.faq, SEO_LINKS.hindi]} />
      </div>
    </div>
  );
}

function Heading({ title, sub, href, cta }: { title: string; sub: string; href: string; cta: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="m-0 text-[40px] font-normal tracking-[-0.6px]">{title}</h2><p className="mt-1.5 text-lg text-muted">{sub}</p></div>
      <Link href={href} className="inline-flex h-12 items-center rounded-full bg-surface px-[22px] text-base">{cta}</Link>
    </div>
  );
}
const Fact = ({ big, small }: { big: string; small: string }) => <div className="flex flex-col gap-1.5"><span className="text-[28px] font-medium">{big}</span><span className="text-base text-muted">{small}</span></div>;
