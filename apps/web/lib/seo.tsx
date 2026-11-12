import type { Metadata } from 'next';
import type { RouteGuideDTO, VehicleModelDTO } from '@valleyride/shared';
import { api } from './api-client';
import { bikePhoto, brandOf } from './bikes';
import { DESK_PHONE, INSTAGRAM_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from './legal';

/**
 * One source for the facts search engines and AI assistants read: the business name, address and phone (NAP),
 * the map pin, hours and the canonical site address. Keep the address in step with the pickup point seed
 * (apps/api/src/db/seeders/20261022-01-locations.js) and the Google Business Profile, word for word.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://valleyride.in' : 'http://localhost:3000')).replace(/\/+$/, '');
export const abs = (path = '/') => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path === '/' ? '' : path}`);

export const BUSINESS = {
  name: 'Valley Ride',
  legalName: 'Valley Ride',
  pickup: {
    name: 'Dorm Hub, Dehradun',
    street: 'Dorm Hub, 4th Floor, Sahastradhara Road, near Doon IT Park, Aman Vihar',
    locality: 'Dehradun',
    region: 'Uttarakhand',
    regionCode: 'IN-UT',
    postalCode: '248001',
    country: 'IN',
    lat: 30.355199,
    lng: 78.082532,
    mapUrl: 'https://maps.app.goo.gl/U7GF6py8rFRpwhqQ8',
    hours: { opens: '08:00', closes: '20:00', label: 'Open every day, 8 AM to 8 PM' },
  },
  phone: DESK_PHONE,
  whatsapp: SUPPORT_PHONE,
  email: SUPPORT_EMAIL,
  /** Profile URLs (Instagram, Google Business Profile, YouTube…), comma-separated, for schema.org sameAs. */
  sameAs: [...new Set([INSTAGRAM_URL, ...(process.env.NEXT_PUBLIC_SAME_AS ?? '').split(',').map((s) => s.trim()).filter(Boolean)])],
} as const;

export const ADDRESS_LINE = `${BUSINESS.pickup.street}, ${BUSINESS.pickup.locality}, ${BUSINESS.pickup.region} ${BUSINESS.pickup.postalCode}`;

export const OG_IMAGE = { url: '/images/og-valley-ride.jpg', width: 1200, height: 630, alt: 'A Royal Enfield Scram 440 and a Triumph Scrambler 400 X from Valley Ride above a sea of clouds near Mussoorie, Uttarakhand' };

/**
 * Page metadata with the canonical URL, Open Graph and Twitter cards filled in the same way everywhere.
 * `title` is the page part only; the root layout adds " | Valley Ride".
 */
export function pageMetadata(o: { title: string; description: string; path: string; keywords?: string[]; image?: string; absoluteTitle?: boolean; languages?: Record<string, string>; noindex?: boolean; locale?: string }): Metadata {
  const images = o.image ? [{ url: o.image }] : [OG_IMAGE];
  return {
    title: o.absoluteTitle ? { absolute: o.title } : o.title,
    description: o.description,
    keywords: o.keywords,
    alternates: { canonical: o.path, languages: o.languages },
    openGraph: { type: 'website', siteName: 'Valley Ride', locale: o.locale ?? 'en_IN', url: o.path, title: o.title, description: o.description, images },
    twitter: { card: 'summary_large_image', title: o.title, description: o.description, images: images.map((i) => i.url) },
    ...(o.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/* ---------- schema.org JSON-LD ---------- */

const BUSINESS_ID = `${SITE_URL}/#business`;

export function businessJsonLd() {
  const p = BUSINESS.pickup;
  return {
    '@context': 'https://schema.org',
    '@type': ['AutoRental', 'LocalBusiness'],
    '@id': BUSINESS_ID,
    name: BUSINESS.name,
    alternateName: ['Valley Ride Dehradun', 'Valley Ride bike rental', 'valleyride.in'],
    url: abs('/'),
    logo: abs('/images/logo.jpg'),
    image: abs(OG_IMAGE.url),
    description: 'Bike and scooty rental in Dehradun, Uttarakhand: Honda Activa 125, Royal Enfield Hunter 350, Scram 440 and Himalayan 450, KTM 390 Adventure X, Triumph Scrambler 400 X, Hero XPulse 210 and Suzuki V-Strom SX 250 on rent for rides to Mussoorie, Rishikesh, Dhanaulti, Chakrata and the Garhwal Himalaya. Pickup and return at Dorm Hub, Sahastradhara Road.',
    slogan: 'Find your ride into the Himalayas',
    address: { '@type': 'PostalAddress', streetAddress: p.street, addressLocality: p.locality, addressRegion: p.region, postalCode: p.postalCode, addressCountry: p.country },
    geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng },
    hasMap: p.mapUrl,
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: p.hours.opens, closes: p.hours.closes }],
    areaServed: [
      { '@type': 'City', name: 'Dehradun' },
      { '@type': 'City', name: 'Mussoorie' },
      { '@type': 'City', name: 'Rishikesh' },
      { '@type': 'State', name: 'Uttarakhand' },
    ],
    knowsLanguage: ['en', 'hi'],
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Credit card, Debit card, Net banking',
    priceRange: '₹₹',
    ...(BUSINESS.phone ? { telephone: BUSINESS.phone } : {}),
    ...(BUSINESS.email ? { email: BUSINESS.email } : {}),
    ...(BUSINESS.sameAs.length ? { sameAs: BUSINESS.sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Valley Ride',
    alternateName: 'Valley Ride: bike and scooty rental in Dehradun',
    url: abs('/'),
    inLanguage: ['en-IN', 'hi-IN'],
    publisher: { '@id': BUSINESS_ID },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...items].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export interface Faq { q: string; a: string }

export function faqJsonLd(faqs: Faq[], lang = 'en-IN') {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/** A bike model as a rentable product with a per-day offer at the Dorm Hub pickup point. */
export function bikeJsonLd(m: VehicleModelDTO) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${abs(`/fleet/${m.slug}`)}#product`,
    name: `${m.name} on rent in Dehradun`,
    brand: { '@type': 'Brand', name: brandOf(m.name) || m.name.split(' ')[0] },
    model: m.name,
    category: m.category === 'SCOOTER' ? 'Scooter rental' : 'Motorcycle rental',
    image: abs(bikePhoto(m)),
    url: abs(`/fleet/${m.slug}`),
    description: `${m.name} (${m.engineCc} cc) on rent in Dehradun with ${m.kmPerDay} km a day included and a refundable deposit. Pickup at Dorm Hub, Sahastradhara Road.`,
    offers: {
      '@type': 'Offer',
      url: abs(`/fleet/${m.slug}`),
      price: (m.pricePerDayPaise / 100).toFixed(2),
      priceCurrency: 'INR',
      priceSpecification: { '@type': 'UnitPriceSpecification', price: (m.pricePerDayPaise / 100).toFixed(2), priceCurrency: 'INR', unitCode: 'DAY', valueAddedTaxIncluded: true },
      availability: (m.units ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      areaServed: 'Dehradun',
      seller: { '@id': BUSINESS_ID },
    },
  };
}

/** A route guide as a tourist trip from Dehradun, its stops as an itinerary. */
export function routeJsonLd(r: RouteGuideDTO, name: string) {
  const stops = r.stops.filter((s) => s.section !== 'eat');
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name,
    url: abs(`/routes/${r.slug}`),
    description: r.bodyMd.split('\n')[0],
    touristType: ['Motorcycle touring', 'Scooter riders', 'Weekend travellers'],
    provider: { '@id': BUSINESS_ID },
    ...(stops.length ? { itinerary: { '@type': 'ItemList', itemListElement: stops.map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristAttraction', name: s.name, description: s.blurb } })) } } : {}),
  };
}

/** Renders JSON-LD. `<` is escaped so text in the data can never close the script tag. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

/* ---------- API reads that never take a page down ---------- */

/** Catalogue for pages that must still render (and stay indexable) if the API is briefly unavailable. */
export const getModelsSafe = () => api.get<VehicleModelDTO[]>('/vehicle-models', { next: { revalidate: 300 } }).catch(() => [] as VehicleModelDTO[]);
export const getRoutesSafe = () => api.get<RouteGuideDTO[]>('/routes', { next: { revalidate: 3600 } }).catch(() => [] as RouteGuideDTO[]);

/** "Dehradun → Mussoorie" → "Dehradun to Mussoorie", the way people search. */
export const routeName = (title: string) => title.replace(/\s*→\s*/g, ' to ');
