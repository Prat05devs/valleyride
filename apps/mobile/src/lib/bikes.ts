import type { ImageSourcePropType } from 'react-native';

import { mediaUrl } from './api';
import { WEB_URL } from './links-web';

/** Cut-out photos keyed by vehicle_models.slug (seeded by apps/api); same set as apps/web/public/images. */
const PHOTOS: Record<string, ImageSourcePropType> = {
  'activa-125': require('../../assets/cut-activa-125.png'),
  'hunter-350': require('../../assets/cut-hunter-350.png'),
  'scram-440': require('../../assets/cut-scram-440.png'),
  'himalayan-450': require('../../assets/cut-himalayan-450.png'),
  'xpulse-210': require('../../assets/cut-xpulse-210.png'),
  'scrambler-400-x': require('../../assets/cut-scrambler-400-x.png'),
  'v-strom-sx-250': require('../../assets/cut-v-strom-sx-250.png'),
  '390-adventure-x': require('../../assets/cut-390-adventure-x.png'),
};

/**
 * A photo uploaded in the admin console (model.images[0]) wins over the bundled cut-out. Models added later without a
 * bundled photo load it from the website's /bike-photo/<slug>, which redirects to the upload or a placeholder.
 */
export const bikePhoto = (m: string | { slug: string; images?: string[] | null }): ImageSourcePropType => {
  const slug = typeof m === 'string' ? m : m.slug;
  const uploaded = typeof m === 'string' ? undefined : m.images?.[0];
  if (uploaded) return { uri: mediaUrl(uploaded) };
  return PHOTOS[slug] ?? { uri: `${WEB_URL}/bike-photo/${encodeURIComponent(slug)}` };
};

/** Positioning lines from the architecture document's fleet table. */
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

export const PHOTOS_HERO = {
  cover: require('../../assets/photo-cover.jpg'),
  welcome: require('../../assets/photo-city.jpg'), // Activa 125 + Hunter 350 on Mall Road, Mussoorie (same as the website's login)
  logo: require('../../assets/logo.jpg'),
};
