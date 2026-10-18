import type { Metadata } from 'next';
import Link from 'next/link';
import type { RouteGuideDTO, VehicleModelDTO } from '@valleyride/shared';
import { RouteArt } from '@/components/brand/art';
import { PhotoHero } from '@/components/layout/photo-hero';
import { api, mediaUrl } from '@/lib/api-client';
import { shortName } from '@/lib/bikes';
import { countWord } from '@/lib/format';
import { ROUTE_META } from '@/lib/routes';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'Ride routes from Dehradun', description: 'Mussoorie, Rishikesh, Sahastradhara and Maldevta: distances, ride times and the right bike for each.' };

export default async function RoutesPage() {
  const [routes, models] = await Promise.all([api.get<RouteGuideDTO[]>('/routes'), api.get<VehicleModelDTO[]>('/vehicle-models')]);
  return (
    <div className="pb-20">
      <PhotoHero active="routes" photo="welcome">
        <h1 className="m-0 max-w-[720px] text-[clamp(40px,5vw,64px)] font-normal tracking-[-1.2px]">Ride the hills from Dehradun</h1>
        <p className="m-0 max-w-[560px] text-[19px] leading-normal text-white/85">{countWord(routes.length).replace(/^./, (c) => c.toUpperCase())} routes our riders love, with distances, ride times and the right bike for each.</p>
      </PhotoHero>
      <main className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(560px,100%),1fr))] gap-4 px-4 pt-14 sm:px-6">
        {routes.map((r) => {
          const meta = ROUTE_META[r.slug];
          const chips = [`${r.distanceKm} km`, r.rideTime ?? (meta?.time && `About ${meta.time}`)].filter(Boolean) as string[];
          return (
            <Link key={r.id} href={`/routes/${r.slug}`} className="flex flex-col gap-3.5 rounded-[36px] bg-surface p-[26px]">
              <div className="flex flex-wrap gap-2">{chips.map((c) => <span key={c} className="inline-flex h-8 items-center rounded-full bg-field px-3.5 text-sm">{c}</span>)}</div>
              {r.cover
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={mediaUrl(r.cover.url)} alt="" loading="lazy" className="h-[200px] w-full rounded-[24px] bg-field object-cover" />
                : <RouteArt kind={meta?.kind ?? 'climb'} height={170} />}
              <h2 className="m-0 text-[28px] font-normal tracking-[-0.3px]">{r.title}</h2>
              <p className="m-0 line-clamp-3 text-base leading-normal text-muted">{r.bodyMd.split('\n')[0]}</p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                <span className="flex flex-wrap gap-2">
                  {r.recommendedModels.map((id) => models.find((m) => m.id === id)).filter(Boolean).map((m) => (
                    <span key={m!.id} className="inline-flex h-9 items-center rounded-full bg-orange-tint px-3.5 text-sm text-orange-ink">{shortName(m!.name)}</span>
                  ))}
                </span>
                <span className="inline-flex h-12 items-center rounded-full bg-ink px-[22px] text-[15px] text-surface">Read the guide</span>
              </div>
            </Link>
          );
        })}
      </main>
    </div>
  );
}
