/** Cut-out photos and positioning lines keyed by vehicle_models.slug (same as apps/mobile/src/lib/bikes.ts). */
export const bikePhoto = (slug: string) => `/images/cut-${['activa-125', 'hunter-350', 'scram-440', 'himalayan-450'].includes(slug) ? slug : 'hunter-350'}.png`;

export const BIKE_COPY: Record<string, { tag: string; use: string }> = {
  'activa-125': { tag: 'City Explorer', use: 'City rides, couples, students and budget travellers.' },
  'hunter-350': { tag: 'Urban Cruiser', use: 'City exploration, Mussoorie rides and weekend trips.' },
  'scram-440': { tag: 'Adventure Crossover', use: 'Scenic routes, hill rides and mixed-road touring.' },
  'himalayan-450': { tag: 'Mountain Explorer', use: 'Long-distance Himalayan touring and adventure trips.' },
};

export const brandOf = (name: string) => (name.startsWith('Royal Enfield') ? 'Royal Enfield' : name.startsWith('Honda') ? 'Honda' : '');
export const shortName = (name: string) => name.replace(/^Royal Enfield |^Honda /, '');
