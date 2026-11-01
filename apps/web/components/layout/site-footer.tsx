import Link from 'next/link';
import type { LocationDTO } from '@valleyride/shared';
import { api } from '@/lib/api-client';
import { PHONE_DISPLAY, POLICY_LINKS, SUPPORT_EMAIL, WHATSAPP_URL } from '@/lib/legal';

export async function SiteFooter() {
  const locations = await api.get<LocationDTO[]>('/locations', { next: { revalidate: 3600 } }).catch(() => [] as LocationDTO[]);
  return (
    <footer className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-8 px-4 pb-12 pt-24 text-[15px] sm:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="Valley Ride" className="h-14 w-14 rounded-full object-cover" />
          <span className="text-[22px] font-medium">Valley <span className="text-orange">Ride</span></span>
        </div>
        <span className="text-muted">Two-wheeler rental in Uttarakhand · www.valleyride.in</span>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium">Pickup points</span>
        {locations.map((l) => <span key={l.id} className="text-muted">{l.name}</span>)}
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium">Valley Ride</span>
        <Link href="/fleet" className="text-muted hover:text-ink">Fleet and prices</Link>
        <Link href="/routes" className="text-muted hover:text-ink">Routes</Link>
        <Link href="/invest" className="text-muted hover:text-ink">Valley Ride Capital</Link>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium">Policies</span>
        {POLICY_LINKS.filter((l) => l.href !== '/contact').map((l) => <Link key={l.href} href={l.href} className="text-muted hover:text-ink">{l.label}</Link>)}
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium">Contact</span>
        <a href={WHATSAPP_URL} className="text-muted hover:text-ink">WhatsApp {PHONE_DISPLAY}</a>
        {SUPPORT_EMAIL && <a href={`mailto:${SUPPORT_EMAIL}`} className="text-muted hover:text-ink">{SUPPORT_EMAIL}</a>}
        <Link href="/contact" className="text-muted hover:text-ink">Contact and support</Link>
      </div>
    </footer>
  );
}
