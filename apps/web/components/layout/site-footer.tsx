import Link from 'next/link';
import type { LocationDTO } from '@valleyride/shared';
import { api } from '@/lib/api-client';

const WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
const EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

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
        <Link href="/terms" className="text-muted hover:text-ink">Rental terms</Link>
      </div>
      {(WHATSAPP || EMAIL) && (
        <div className="flex flex-col gap-2">
          <span className="font-medium">Contact</span>
          {WHATSAPP && <a href={`https://wa.me/${WHATSAPP.replace(/\D/g, '')}`} className="text-muted hover:text-ink">WhatsApp {WHATSAPP}</a>}
          {EMAIL && <a href={`mailto:${EMAIL}`} className="text-muted hover:text-ink">{EMAIL}</a>}
        </div>
      )}
    </footer>
  );
}
