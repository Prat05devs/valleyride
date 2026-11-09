import Link from 'next/link';
import { SEO_LINKS } from '@/components/seo/blocks';
import { PHONE_DISPLAY, POLICY_LINKS, SUPPORT_EMAIL, TEL_URL, WHATSAPP_URL } from '@/lib/legal';
import { ADDRESS_LINE, BUSINESS } from '@/lib/seo';

/**
 * Name, address and hours are static and word-for-word the same as the structured data and the Google Business
 * Profile (consistent NAP is a local-search signal), so the footer never depends on the API.
 */
export function SiteFooter() {
  const { pickup } = BUSINESS;
  return (
    <footer className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-8 px-4 pb-12 pt-24 text-[15px] sm:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="Valley Ride logo" loading="lazy" className="h-14 w-14 rounded-full object-cover" />
          <span className="text-[22px] font-medium">Valley <span className="text-orange">Ride</span></span>
        </div>
        <span className="text-muted">Bike and scooty rental in Dehradun, Uttarakhand · www.valleyride.in</span>
        <span className="font-medium">Pickup and return</span>
        <address className="not-italic leading-normal text-muted">{ADDRESS_LINE}</address>
        <span className="text-muted">{pickup.hours.label}</span>
        <a href={pickup.mapUrl} target="_blank" rel="noreferrer" className="text-muted underline hover:text-ink">Open in Google Maps</a>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium">Rent in Dehradun</span>
        {[SEO_LINKS.bikes, SEO_LINKS.scooty, SEO_LINKS.enfield, SEO_LINKS.fleet, SEO_LINKS.pickup].map((l) => <Link key={l.href} href={l.href} className="text-muted hover:text-ink">{l.label}</Link>)}
        <Link href="/invest" className="text-muted hover:text-ink">Valley Ride Capital</Link>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium">Ride guides</span>
        {[SEO_LINKS.places, SEO_LINKS.mussoorie, SEO_LINKS.rishikesh, { href: '/routes', label: 'All routes' }, SEO_LINKS.faq].map((l) => <Link key={l.href} href={l.href} className="text-muted hover:text-ink">{l.label}</Link>)}
        <Link href="/hi/bike-rental-dehradun" hrefLang="hi" lang="hi" className="text-muted hover:text-ink">हिंदी में जानकारी</Link>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium">Policies</span>
        {POLICY_LINKS.filter((l) => l.href !== '/contact').map((l) => <Link key={l.href} href={l.href} className="text-muted hover:text-ink">{l.label}</Link>)}
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium">Contact</span>
        <a href={TEL_URL} className="text-muted hover:text-ink">Call {PHONE_DISPLAY}</a>
        <a href={WHATSAPP_URL} className="text-muted hover:text-ink">WhatsApp {PHONE_DISPLAY}</a>
        {SUPPORT_EMAIL && <a href={`mailto:${SUPPORT_EMAIL}`} className="text-muted hover:text-ink">{SUPPORT_EMAIL}</a>}
        <Link href="/contact" className="text-muted hover:text-ink">Contact and support</Link>
      </div>
    </footer>
  );
}
