import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import { Providers } from '@/components/layout/providers';
import './globals.css';

const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-urbanist', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://valleyride.in' : 'http://localhost:3000')),
  title: { default: 'Valley Ride · Scooter & motorcycle rentals in Dehradun', template: '%s | Valley Ride' },
  description: 'Scooters for the city, Royal Enfields for the mountains. Real-time availability and transparent pricing in Dehradun, Mussoorie and Rishikesh.',
  icons: { icon: '/images/logo.jpg' },
};

/** Pages place their own header (light, or dark over a photo) as in the design; see components/layout/site-header. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={urbanist.variable}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
