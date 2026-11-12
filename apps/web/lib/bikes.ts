import { mediaUrl } from './api-client';

/**
 * Model photos and positioning lines keyed by vehicle_models.slug (same as apps/mobile/src/lib/bikes.ts).
 * A photo uploaded in Admin → Pricing (vehicle_models.images[0], served by the API) wins over the cut-out bundled
 * here; a model added in the console without a photo gets a neutral placeholder.
 */
const BUNDLED = new Set([
  'activa-125', 'hunter-350', 'scram-440', 'himalayan-450', 'xpulse-210', 'scrambler-400-x', 'v-strom-sx-250', '390-adventure-x',
]);

/** The bundled cut-out (or placeholder) for a slug, ignoring uploads. */
export const bundledPhoto = (slug: string) => (BUNDLED.has(slug) ? `/images/cut-${slug}.png` : '/images/bike-placeholder.svg');

/**
 * Pass the model when it is at hand (list and detail pages carry `images`): the photo URL is resolved directly.
 * With only a slug (bookings, invoices), /bike-photo/<slug> redirects to the uploaded or bundled photo.
 */
export const bikePhoto = (m: string | { slug: string; images?: string[] | null }) => {
  if (typeof m === 'string' || !Array.isArray(m.images)) return `/bike-photo/${encodeURIComponent(typeof m === 'string' ? m : m.slug)}`;
  return m.images[0] ? mediaUrl(m.images[0]) : bundledPhoto(m.slug);
};

export const BIKE_COPY: Record<string, { tag: string; use: string }> = {
  'activa-125': { tag: 'City Explorer', use: 'City rides, couples, students and budget travellers.' },
  'hunter-350': { tag: 'Urban Cruiser', use: 'City exploration, Mussoorie rides and weekend trips.' },
  'scram-440': { tag: 'Adventure Crossover', use: 'Scenic routes, hill rides and mixed-road touring.' },
  'himalayan-450': { tag: 'Mountain Explorer', use: 'Long-distance Himalayan touring and adventure trips.' },
  'xpulse-210': { tag: 'Trail Explorer', use: 'Dirt tracks, river crossings and light adventure touring.' },
  'scrambler-400-x': { tag: 'Modern Scrambler', use: 'Hill roads, café rides and mixed-terrain weekends.' },
  'v-strom-sx-250': { tag: 'Easy Tourer', use: 'Comfortable long rides, couples and multi-day hill trips.' },
  '390-adventure-x': { tag: 'High-Altitude Tourer', use: 'Experienced riders, long tours and high-mountain routes.' },
};

const BRANDS = ['Royal Enfield', 'Honda', 'Hero', 'Triumph', 'Suzuki', 'KTM'];
export const brandOf = (name: string) => BRANDS.find((b) => name.startsWith(`${b} `)) ?? '';
export const shortName = (name: string) => { const b = brandOf(name); return b ? name.slice(b.length + 1) : name; };
