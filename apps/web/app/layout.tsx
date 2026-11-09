import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import { Providers } from '@/components/layout/providers';
import { BUSINESS, businessJsonLd, JsonLd, SITE_URL, websiteJsonLd } from '@/lib/seo';
import './globals.css';

const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-urbanist', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Bike & Scooty on Rent in Dehradun | Valley Ride', template: '%s | Valley Ride' },
  description: 'Bike and scooty rental in Dehradun: Honda Activa 125 and Royal Enfield Hunter 350, Scram 440 and Himalayan 450 for rides to Mussoorie, Rishikesh and across Uttarakhand. Pickup at Dorm Hub, Sahastradhara Road.',
  applicationName: 'Valley Ride',
  category: 'travel',
  creator: 'Valley Ride',
  publisher: 'Valley Ride',
  icons: { icon: '/images/logo.jpg', apple: '/images/logo.jpg' },
  openGraph: { type: 'website', siteName: 'Valley Ride', locale: 'en_IN', images: [{ url: '/images/photo-cover.jpg', width: 1500, height: 844, alt: 'A Honda Activa and three Royal Enfield motorcycles on a Himalayan road in Uttarakhand' }] },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { other: { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } } : {}),
  },
  // Regional hints for local search engines and directories; the schema.org data below is the main signal.
  other: {
    'geo.region': BUSINESS.pickup.regionCode,
    'geo.placename': 'Dehradun',
    'geo.position': `${BUSINESS.pickup.lat};${BUSINESS.pickup.lng}`,
    ICBM: `${BUSINESS.pickup.lat}, ${BUSINESS.pickup.lng}`,
  },
};

/** Pages place their own header (light, or dark over a photo) as in the design; see components/layout/site-header. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={urbanist.variable}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <JsonLd data={[businessJsonLd(), websiteJsonLd()]} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
