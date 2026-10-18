import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { LocationDTO, RouteGuideDTO, VehicleModelDTO } from '@valleyride/shared';
import { BookPanel } from '@/components/booking/book-panel';
import { ModelSpecs } from '@/components/fleet/model-specs';
import { SiteHeader } from '@/components/layout/site-header';
import { api, ApiError } from '@/lib/api-client';
import { BIKE_COPY, bikePhoto, shortName } from '@/lib/bikes';
import { formatPaise } from '@/lib/format';

export const revalidate = 300;

async function getModel(slug: string) {
  try {
    return await api.get<VehicleModelDTO>(`/vehicle-models/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = await getModel((await params).slug);
  const year = m.specs ? `${m.specs.modelYear} ` : '';
  return {
    title: `Rent ${m.name} in Dehradun`,
    description: `${year}${m.name} from ${formatPaise(m.pricePerDayPaise)} a day with ${m.kmPerDay} km included.${m.specs ? ` ${m.specs.highlights.map((h) => `${h.label} ${h.value}`).join(', ')}.` : ''}`,
  };
}

export default async function VehicleModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const m = await getModel((await params).slug);
  const [locations, routes] = await Promise.all([
    api.get<LocationDTO[]>('/locations'),
    api.get<RouteGuideDTO[]>('/routes').catch(() => [] as RouteGuideDTO[]),
  ]);
  const goodFor = routes.filter((r) => r.recommendedModels.includes(m.id));
  const facts = [
    [`${m.engineCc} cc`, 'engine'], [`${m.kmPerDay} km`, 'included per day'], [`${formatPaise(m.extraKmPaise)}/km`, 'after that'], [formatPaise(m.depositPaise), 'refundable deposit'],
  ];
  return (
    <div className="pb-20">
      <SiteHeader active="fleet" />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex gap-2 text-[15px] text-muted"><Link href="/fleet" className="underline">Fleet</Link><span aria-hidden="true">/</span><span className="text-ink">{shortName(m.name)}</span></nav>
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
            <div className="flex h-[min(520px,70vw)] items-center justify-center rounded-[40px] bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bikePhoto(m.slug)} alt={m.name} className="h-[88%] w-[86%] object-contain" />
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-3">
              {facts.map(([big, small]) => <div key={small} className="rounded-card bg-surface p-5"><div className="text-2xl font-medium">{big}</div><div className="text-[15px] text-muted">{small}</div></div>)}
            </div>
            {m.specs ? <ModelSpecs name={shortName(m.name)} specs={m.specs} goodFor={goodFor} use={BIKE_COPY[m.slug]?.use} /> : (
              <div className="flex flex-col gap-3 rounded-[36px] bg-surface p-7">
                <h2 className="m-0 text-[26px] font-normal">Good for</h2>
                <p className="m-0 text-[17px] leading-[1.55] text-body">{BIKE_COPY[m.slug]?.use}</p>
                {goodFor.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-2.5">
                    {goodFor.map((r) => <Link key={r.id} href={`/routes/${r.slug}`} className="inline-flex h-11 items-center rounded-full bg-orange-tint px-[18px] text-[15px] text-orange-ink">{r.title}</Link>)}
                  </div>
                )}
              </div>
            )}
          </div>
          <BookPanel model={m} locations={locations} />
        </div>
      </main>
    </div>
  );
}
