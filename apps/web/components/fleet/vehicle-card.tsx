import Link from 'next/link';
import type { VehicleModelDTO } from '@valleyride/shared';
import { BIKE_COPY, bikePhoto, brandOf, shortName } from '@/lib/bikes';
import { formatPaise } from '@/lib/format';

export const CATEGORY_LABEL: Record<VehicleModelDTO['category'], string> = {
  SCOOTER: 'Scooter', MOTORCYCLE: 'Motorcycle', ADVENTURE: 'Adventure',
};

/** Fleet page card: photo tile, positioning line, price and the "Check your dates" CTA. */
export function VehicleCard({ model }: { model: VehicleModelDTO }) {
  return (
    <Link href={`/fleet/${model.slug}`} className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] items-center gap-5 rounded-[36px] bg-surface p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">
      <div className="flex h-[230px] items-center justify-center rounded-card bg-field">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bikePhoto(model.slug)} alt={model.name} className="h-[200px] w-[88%] object-contain" />
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="inline-flex h-[30px] items-center self-start rounded-full bg-field px-3 text-sm">{CATEGORY_LABEL[model.category]} · {BIKE_COPY[model.slug]?.tag}</span>
        <div><div className="text-[15px] text-muted">{brandOf(model.name)}</div><div className="text-[28px] tracking-[-0.3px]">{shortName(model.name)}</div></div>
        <p className="m-0 text-[15px] leading-[1.45] text-body">{BIKE_COPY[model.slug]?.use}</p>
        <div className="flex items-baseline gap-1.5"><span className="text-[30px] font-medium">{formatPaise(model.pricePerDayPaise)}</span><span className="text-[15px] text-muted">/day</span></div>
        <span className="text-sm text-muted">{model.kmPerDay} km/day · {formatPaise(model.extraKmPaise)}/km after · {formatPaise(model.depositPaise)} deposit</span>
        <span className="mt-1 inline-flex h-12 items-center self-start rounded-full bg-ink px-[22px] text-[15px] text-surface">Check your dates</span>
      </div>
    </Link>
  );
}
