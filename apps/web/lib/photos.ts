/**
 * Fleet photos used as page backgrounds (public/images/hero, WebP at 1280, 1920 and 2560 px wide; see
 * docs/HERO-IMAGES.md). Pages use different ones so the site does not repeat the same picture everywhere.
 */
export const HERO_PHOTOS = {
  city: '/images/hero/hero-city', // Activa 125 + Hunter 350, Mall Road, Mussoorie at dusk
  weekend: '/images/hero/hero-weekend', // Scram 440 + Scrambler 400 X above the clouds
  touring: '/images/hero/hero-touring', // Himalayan 450 + V-Strom SX 250, Bhagirathi valley
  offroad: '/images/hero/hero-offroad', // KTM 390 Adventure X + XPulse 210, stream trail
} as const;
export type HeroPhoto = keyof typeof HERO_PHOTOS;

const WIDTHS = [1280, 1920, 2560];
export const photoSrc = (base: string) => `${base}-1920.webp`;
export const photoSrcSet = (base: string) => WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
/** A full-height background on a tall phone shows the photo much wider than the screen. */
export const PHOTO_SIZES = '(orientation: portrait) 300vw, 100vw';
