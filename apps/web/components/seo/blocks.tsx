import Link from 'next/link';
import type { VehicleModelDTO } from '@valleyride/shared';
import { BIKE_COPY, bikePhoto, shortName } from '@/lib/bikes';
import { formatPaise } from '@/lib/format';
import { ADDRESS_LINE, BUSINESS, type Faq } from '@/lib/seo';
import type { Place } from '@/lib/seo-content';

/** Visible breadcrumb trail; pair it with breadcrumbJsonLd on the page. */
export function Breadcrumbs({ items, dark = false }: { items: { name: string; path?: string }[]; dark?: boolean }) {
  const all = [{ name: 'Home', path: '/' }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap gap-2 text-[15px] ${dark ? 'text-white/85' : 'text-muted'}`}>
      {all.map((it, i) => (
        <span key={it.name} className="flex gap-2">
          {i > 0 && <span aria-hidden="true">/</span>}
          {it.path && i < all.length - 1 ? <Link href={it.path} className="underline">{it.name}</Link> : <span aria-current="page" className={dark ? 'text-surface' : 'text-ink'}>{it.name}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Card({ title, id, children, as: H = 'h2' }: { title?: string; id?: string; children: React.ReactNode; as?: 'h2' | 'h3' }) {
  return (
    <section id={id} className="flex scroll-mt-28 flex-col gap-3 rounded-[36px] bg-surface p-7 sm:p-8">
      {title && <H className="m-0 text-[28px] font-normal tracking-[-0.3px]">{title}</H>}
      {children}
    </section>
  );
}

export const P = ({ children }: { children: React.ReactNode }) => <p className="m-0 text-[17px] leading-[1.6] text-body">{children}</p>;

const fmtPhone = (e164: string) => e164.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2');

/** Names for the cards when the catalogue cannot be loaded. */
const FALLBACK_NAME: Record<string, string> = {
  'activa-125': 'Honda Activa 125', 'hunter-350': 'Royal Enfield Hunter 350', 'xpulse-210': 'Hero XPulse 210', 'v-strom-sx-250': 'Suzuki V-Strom SX 250',
  'scram-440': 'Royal Enfield Scram 440', 'scrambler-400-x': 'Triumph Scrambler 400 X', '390-adventure-x': 'KTM 390 Adventure X', 'himalayan-450': 'Royal Enfield Himalayan 450',
};

/** Bikes with live prices when the catalogue is available, else the same cards without numbers. */
export function BikeCards({ models, only, alt }: { models: VehicleModelDTO[]; only?: string[]; alt: (name: string) => string }) {
  const slugs = only ?? (models.length ? models.map((m) => m.slug) : Object.keys(FALLBACK_NAME));
  const shown = slugs.map((s) => ({ slug: s, m: models.find((x) => x.slug === s) }));
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
      {shown.map(({ slug, m }) => {
        const name = m?.name ?? FALLBACK_NAME[slug]!;
        return (
          <Link key={slug} href={`/fleet/${slug}`} className="flex flex-col gap-2.5 rounded-sheet bg-surface px-5 pb-5 pt-4 transition-transform hover:-translate-y-0.5">
            <span className="inline-flex h-[30px] items-center self-start rounded-full bg-field px-3 text-sm">{BIKE_COPY[slug]?.tag}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bikePhoto(slug)} alt={alt(name)} loading="lazy" className="h-[160px] w-full object-contain" />
            <span className="text-xl">{shortName(name)}</span>
            {m && <span className="text-[15px] text-muted">{formatPaise(m.pricePerDayPaise)}/day · {m.kmPerDay} km/day included · {formatPaise(m.depositPaise)} refundable deposit</span>}
            <span className="text-[15px] leading-normal text-body">{BIKE_COPY[slug]?.use}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** Name, address and hours exactly as in the structured data and the Google Business Profile. */
export function PickupCard({ map = false }: { map?: boolean }) {
  const p = BUSINESS.pickup;
  return (
    <section aria-labelledby="pickup-title" className="flex flex-col gap-4 rounded-[36px] bg-dark p-7 text-surface sm:p-8">
      <h2 id="pickup-title" className="m-0 text-[28px] font-normal tracking-[-0.3px]">Pickup and return: Dorm Hub, Dehradun</h2>
      <address className="not-italic text-[17px] leading-[1.6] text-white/85">{ADDRESS_LINE}</address>
      <p className="m-0 text-[17px] text-white/85">{p.hours.label}. One point for pickup and return.</p>
      {(BUSINESS.phone || BUSINESS.whatsapp) && (
        <p className="m-0 text-[17px] text-white/85">
          {BUSINESS.phone && <>Desk: <a href={`tel:${BUSINESS.phone}`} className="underline">{fmtPhone(BUSINESS.phone)}</a></>}
          {BUSINESS.phone && BUSINESS.whatsapp && ' · '}
          {BUSINESS.whatsapp && <>WhatsApp: <a href={`https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, '')}`} className="underline">{fmtPhone(BUSINESS.whatsapp)}</a></>}
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <a href={p.mapUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full bg-surface px-[22px] text-[15px] text-ink">Open in Google Maps</a>
        <Link href="/book" className="inline-flex h-12 items-center rounded-full border border-white/40 px-[22px] text-[15px]">Book a bike</Link>
      </div>
      {map && (
        <iframe title="Map: Valley Ride pickup point at Dorm Hub, Sahastradhara Road, Dehradun" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${p.lat},${p.lng}&z=16&output=embed`} className="mt-1 aspect-[16/10] w-full rounded-[24px] border-0 bg-white/10" />
      )}
    </section>
  );
}

/** Questions as visible headings with direct answers, so they can be read and quoted without opening anything. */
export function FaqList({ faqs, title = 'Frequently asked questions', lang }: { faqs: Faq[]; title?: string; lang?: string }) {
  return (
    <section lang={lang} aria-labelledby="faq-title" className="flex flex-col gap-4 rounded-[36px] bg-surface p-7 sm:p-8">
      <h2 id="faq-title" className="m-0 text-[28px] font-normal tracking-[-0.3px]">{title}</h2>
      {faqs.map((f) => (
        <div key={f.q} className="flex flex-col gap-1.5 border-t border-line pt-4 first-of-type:border-0 first-of-type:pt-0">
          <h3 className="m-0 text-xl font-normal">{f.q}</h3>
          <p className="m-0 text-[17px] leading-[1.6] text-body">{f.a}</p>
        </div>
      ))}
    </section>
  );
}

export function PlaceCard({ place }: { place: Place }) {
  const facts: [string, string][] = [['Distance', place.distance], ['Ride time', place.time], ['Best bike', place.bikes], ['When to go', place.season]];
  return (
    <article id={place.id} className="flex scroll-mt-28 flex-col gap-3 rounded-[32px] bg-surface p-6">
      <h3 className="m-0 text-[24px] font-normal">{place.name}</h3>
      <p className="m-0 text-base leading-[1.6] text-body">{place.blurb}</p>
      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-x-4 gap-y-2 text-[15px]">
        {facts.map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="m-0">{v}</dd></div>)}
      </dl>
      {place.guide && <Link href={place.guide} className="self-start text-[15px] underline">Read the full route guide</Link>}
    </article>
  );
}

/** Internal links between the landing pages, the fleet and the guides. */
export function RelatedLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Related pages" className="flex flex-wrap gap-2.5">
      {links.map((l) => <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center rounded-full bg-orange-tint px-[18px] py-2 text-[15px] text-orange-ink">{l.label}</Link>)}
    </nav>
  );
}

export const SEO_LINKS = {
  bikes: { href: '/bike-rental-dehradun', label: 'Bike rental in Dehradun' },
  scooty: { href: '/scooty-rental-dehradun', label: 'Scooty on rent in Dehradun' },
  enfield: { href: '/royal-enfield-rental-dehradun', label: 'Royal Enfield on rent in Dehradun' },
  adventure: { href: '/adventure-bike-rental-dehradun', label: 'KTM, Triumph and adventure bikes on rent' },
  invest: { href: '/invest', label: 'Valley Ride Capital: invest in the fleet' },
  places: { href: '/places-to-visit-near-dehradun', label: 'Places to ride from Dehradun' },
  mussoorie: { href: '/routes/dehradun-mussoorie', label: 'Dehradun to Mussoorie by bike' },
  rishikesh: { href: '/routes/dehradun-rishikesh', label: 'Dehradun to Rishikesh by bike' },
  pickup: { href: '/pickup-location', label: 'Pickup point: Dorm Hub' },
  faq: { href: '/faq', label: 'Bike rental FAQ' },
  hindi: { href: '/hi/bike-rental-dehradun', label: 'हिंदी में जानकारी' },
  fleet: { href: '/fleet', label: 'Fleet and prices' },
};
