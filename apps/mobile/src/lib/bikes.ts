import type { ImageSourcePropType } from 'react-native';

/** Cut-out photos keyed by vehicle_models.slug (seeded by apps/api). */
const PHOTOS: Record<string, ImageSourcePropType> = {
  'activa-125': require('../../assets/cut-activa-125.png'),
  'hunter-350': require('../../assets/cut-hunter-350.png'),
  'scram-440': require('../../assets/cut-scram-440.png'),
  'himalayan-450': require('../../assets/cut-himalayan-450.png'),
};

export const bikePhoto = (slug: string) => PHOTOS[slug] ?? PHOTOS['hunter-350'];

/** Positioning lines from the architecture document's fleet table. */
export const BIKE_COPY: Record<string, { tag: string; use: string }> = {
  'activa-125': { tag: 'City Explorer', use: 'City rides, couples, students and budget travellers.' },
  'hunter-350': { tag: 'Urban Cruiser', use: 'City exploration, Mussoorie rides and weekend trips.' },
  'scram-440': { tag: 'Adventure Crossover', use: 'Scenic routes, hill rides and mixed-road touring.' },
  'himalayan-450': { tag: 'Mountain Explorer', use: 'Long-distance Himalayan touring and adventure trips.' },
};

export const brandOf = (name: string) => (name.startsWith('Royal Enfield') ? 'Royal Enfield' : name.startsWith('Honda') ? 'Honda' : '');
export const shortName = (name: string) => name.replace(/^Royal Enfield |^Honda /, '');

export const PHOTOS_HERO = {
  cover: require('../../assets/photo-cover.jpg'),
  welcome: require('../../assets/photo-welcome.jpg'),
  logo: require('../../assets/logo.jpg'),
};
