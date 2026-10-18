import Link from 'next/link';
import type { LocationDTO, RouteGuideDTO, VehicleModelDTO } from '@valleyride/shared';
import { RouteArt } from '@/components/brand/art';
import { SearchForm } from '@/components/booking/search-form';
import { SiteHeader } from '@/components/layout/site-header';
import { api, mediaUrl } from '@/lib/api-client';
import { BIKE_COPY, bikePhoto, shortName } from '@/lib/bikes';
import { countWord, formatPaise } from '@/lib/format';
import { ROUTE_META, routeLine } from '@/lib/routes';
import { defaultWindow } from '@/lib/when';

export const revalidate = 300;

const CATEGORY = { SCOOTER: 'Scooter', MOTORCYCLE: 'Motorcycle', ADVENTURE: 'Adventure' } as const;

export default async function HomePage() {
  const [models, locations, routes] = await Promise.all([
    api.get<VehicleModelDTO[]>('/vehicle-models', { next: { revalidate: 300 } }),
    api.get<LocationDTO[]>('/locations', { next: { revalidate: 3600 } }),
    api.get<RouteGuideDTO[]>('/routes', { next: { revalidate: 3600 } }).catch(() => [] as RouteGuideDTO[]),
  ]);
  const units = models.reduce((s, m) => s + (m.units ?? 0), 0);

  return (
    <div>
      <section className="relative min-h-[760px] overflow-hidden rounded-b-[48px] bg-hero text-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/photo-cover.jpg" alt="A Honda Activa and three Royal Enfields on a Himalayan road" className="absolute inset-0 h-full w-full object-cover object-[center_55%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.28)_45%,rgba(0,0,0,0.7)_100%)]" />
        <SiteHeader variant="dark" />
        <div className="relative mx-auto flex max-w-[1280px] flex-col gap-9 px-4 pb-14 pt-[72px] sm:px-6">
          <div className="flex max-w-[720px] flex-col gap-4">
            <span className="text-base text-white/85">Dehradun · Mussoorie · Rishikesh</span>
            <h1 className="m-0 text-[clamp(40px,6vw,72px)] font-normal leading-[1.02] tracking-[-1.5px]">Find your ride into the Himalayas</h1>
            <p className="m-0 max-w-[600px] text-xl leading-normal text-white/85">Scooters for the city, Royal Enfields for the mountains. Real-time availability and transparent pricing, with deposits refunded on return.</p>
          </div>
          <SearchForm locations={locations} initial={{ pickup: locations[0]?.id ?? '', returnTo: '', ...defaultWindow() }} />
        </div>
      </section>

      <section className="mx-auto flex max-w-[1280px] flex-col gap-7 px-4 pt-24 sm:px-6">
        <Heading title="Pick your bike" sub={`${units} bikes across ${countWord(models.length)} models. Prices per day, before GST.`} href="/fleet" cta="See the full fleet" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4">
          {models.map((m) => (
            <Link key={m.id} href={`/fleet/${m.slug}`} className="flex flex-col gap-3 rounded-sheet bg-surface px-[22px] pb-6 pt-5 transition-transform hover:-translate-y-0.5">
              <span className="inline-flex h-[30px] items-center self-start rounded-full bg-field px-3 text-sm">{CATEGORY[m.category]} · {BIKE_COPY[m.slug]?.tag}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bikePhoto(m.slug)} alt={m.name} className="h-[190px] w-full object-contain" />
              <div className="flex items-baseline justify-between"><span className="text-[22px]">{shortName(m.name)}</span><span className="text-2xl font-medium">{formatPaise(m.pricePerDayPaise)}<span className="text-[15px] font-normal text-muted">/day</span></span></div>
              <span className="text-[15px] text-muted">{m.kmPerDay} km/day · {formatPaise(m.depositPaise)} deposit</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 pt-24 sm:px-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-8 rounded-[40px] bg-dark p-8 text-surface sm:p-12">
          <div className="flex flex-col gap-2.5"><h2 className="m-0 text-4xl font-normal tracking-[-0.5px]">How it works</h2><p className="m-0 text-[17px] leading-normal text-white/80">No paperwork at the desk. Everything is done on your phone.</p></div>
          {[
            ['Book and pay', 'See real availability, pay rental and deposit by UPI or card. Your bike is held while you pay.'],
            ['Digital pickup', 'We check your licence, take pre-ride photos together and you sign the agreement on your phone.'],
            ['Return, get your deposit', 'After a quick inspection the deposit is refunded to the card or UPI you paid with.'],
          ].map(([t, d], i) => (
            <div key={t} className="flex flex-col gap-2.5">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-medium ${i === 0 ? 'bg-orange text-ink' : 'bg-white/[0.14]'}`}>{i + 1}</span>
              <span className="text-xl">{t}</span><span className="text-base leading-normal text-white/80">{d}</span>
            </div>
          ))}
        </div>
      </section>

      {routes.length > 0 && (
        <section className="mx-auto flex max-w-[1280px] flex-col gap-7 px-4 pt-24 sm:px-6">
          <Heading title="Popular routes" sub="Rides our team knows well, with the right bike for each." href="/routes" cta="All route guides" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4">
            {routes.map((r) => (
              <Link key={r.id} href={`/routes/${r.slug}`} className="flex flex-col gap-2 rounded-card bg-surface px-5 pb-[22px] pt-[18px]">
                {r.mapImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={mediaUrl(r.mapImage)} alt="" loading="lazy" className="h-[150px] w-full rounded-[20px] bg-field object-cover" />
                  : <RouteArt kind={ROUTE_META[r.slug]?.kind ?? 'climb'} height={110} />}
                <span className="text-xl">{r.title}</span>
                <span className="text-[15px] text-muted">{routeLine(r.slug, r.distanceKm)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1280px] px-4 pt-24 sm:px-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] items-start gap-6 rounded-[40px] bg-surface p-8 sm:p-10">
          <div className="flex flex-col gap-2"><h2 className="m-0 text-[32px] font-normal tracking-[-0.4px]">Clear pricing</h2><p className="m-0 text-base leading-normal text-muted">What you see at checkout is what you pay. GST is added at 18%.</p></div>
          <Fact big="10–35% off" small="10% from 3 days, 20% from 7, 35% from 28" />
          <Fact big="₹400" small="to return at another pickup point" />
          <Fact big="Refundable" small="deposit, returned after inspection" />
        </div>
      </section>
    </div>
  );
}

function Heading({ title, sub, href, cta }: { title: string; sub: string; href: string; cta: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="m-0 text-[40px] font-normal tracking-[-0.6px]">{title}</h2><p className="mt-1.5 text-lg text-muted">{sub}</p></div>
      <Link href={href} className="inline-flex h-12 items-center rounded-full bg-surface px-[22px] text-base">{cta}</Link>
    </div>
  );
}
const Fact = ({ big, small }: { big: string; small: string }) => <div className="flex flex-col gap-1.5"><span className="text-[28px] font-medium">{big}</span><span className="text-base text-muted">{small}</span></div>;
