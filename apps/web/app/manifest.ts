import type { MetadataRoute } from 'next';

/** PWA manifest (the architecture doc's "mobile-first · PWA" customer web). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Valley Ride', short_name: 'Valley Ride',
    description: 'Scooter and motorcycle rentals in Dehradun, Mussoorie and Rishikesh.',
    start_url: '/', display: 'standalone', background_color: '#ECEEF0', theme_color: '#000000',
    icons: [{ src: '/images/logo.jpg', sizes: '512x512', type: 'image/jpeg', purpose: 'any' }],
  };
}
