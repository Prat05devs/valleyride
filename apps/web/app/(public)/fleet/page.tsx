import { api } from '@/lib/api-client';
import { FleetGrid } from '@/components/fleet/fleet-grid';
import { SiteHeader } from '@/components/layout/site-header';
import { countWord, formatPaise } from '@/lib/format';
import type { LocationDTO, VehicleModelDTO } from '@valleyride/shared';

export const revalidate = 300;   // ISR: rebuild every 5 minutes; prices change rarely

export const metadata = {
  title: 'Rent scooters & Royal Enfield bikes in Dehradun | Valley Ride',
  description: 'Activa 125, Hunter 350, Scram 440 and Himalayan 450 for Mussoorie and Rishikesh rides.',
};

export default async function FleetPage() {
  const [models, locations] = await Promise.all([api.get<VehicleModelDTO[]>('/vehicle-models'), api.get<LocationDTO[]>('/locations')]);
  const units = models.reduce((s, m) => s + (m.units ?? 0), 0);
  return (
    <div className="pb-20">
      <SiteHeader active="fleet" />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-7 px-4 pt-10 sm:px-6">
        <FleetGrid models={models} title={<h1 className="m-0 text-5xl font-normal tracking-[-0.8px]">Our fleet</h1>}
          sub={`${units} bikes across ${countWord(models.length)} models, at ${countWord(locations.length)} pickup points.`} />
        <section className="flex flex-col gap-4 rounded-[36px] bg-surface p-7">
          <h2 className="m-0 text-[28px] font-normal">Compare</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-base">
              <thead><tr className="text-left text-sm text-muted">{['Model', 'Per day', 'Deposit', 'Included', 'Extra km', 'Engine', 'In the fleet'].map((h) => <th key={h} className="p-3 font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} className="border-t border-line">
                    <td className="px-3 py-3.5">{m.name}</td><td className="px-3 py-3.5 font-medium">{formatPaise(m.pricePerDayPaise)}</td>
                    <td className="px-3 py-3.5">{formatPaise(m.depositPaise)}</td><td className="px-3 py-3.5">{m.kmPerDay} km/day</td>
                    <td className="px-3 py-3.5">{formatPaise(m.extraKmPaise)}/km</td><td className="px-3 py-3.5">{m.engineCc} cc</td><td className="px-3 py-3.5">{m.units ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-sm text-muted">Prices before 18% GST. Longer rentals: 10% off from 3 days, 20% from 7, 35% from 28.</p>
        </section>
      </main>
    </div>
  );
}
