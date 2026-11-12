import { FleetGrid } from '@/components/fleet/fleet-grid';
import { RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { SiteHeader } from '@/components/layout/site-header';
import { countWord, formatPaise } from '@/lib/format';
import { abs, bikeJsonLd, breadcrumbJsonLd, getModelsSafe, JsonLd, pageMetadata } from '@/lib/seo';

export const revalidate = 300;   // ISR: rebuild every 5 minutes; prices change rarely

export const metadata = pageMetadata({
  title: 'Bike & Scooty Rent Prices in Dehradun · 8 Models | Valley Ride',
  absoluteTitle: true,
  description: 'Daily rent, km and deposit for every bike at Valley Ride Dehradun: Activa 125, Royal Enfield, KTM 390 Adventure X, Triumph Scrambler 400 X and more. GST included.',
  path: '/fleet',
  keywords: ['bike rent price Dehradun', 'scooty rent price Dehradun', 'Royal Enfield rent price Dehradun', 'bike rental fleet Dehradun'],
});

export default async function FleetPage() {
  const models = await getModelsSafe();
  const units = models.reduce((s, m) => s + (m.units ?? 0), 0);
  const list = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Bikes and scooters for rent in Dehradun', itemListElement: models.map((m, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/fleet/${m.slug}`), item: bikeJsonLd(m) })) };
  return (
    <div className="pb-20">
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Fleet', path: '/fleet' }]), ...(models.length ? [list] : [])]} />
      <SiteHeader active="fleet" />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-7 px-4 pt-10 sm:px-6">
        <FleetGrid models={models} title={<h1 key="title" className="m-0 text-[clamp(36px,8vw,48px)] font-normal leading-[1.08] tracking-[-0.8px]">Bikes and scooters for rent in Dehradun</h1>}
          sub={models.length ? `${units} bikes across ${countWord(models.length)} models, at Dorm Hub, Sahastradhara Road.` : 'Live prices are loading. Please check back in a minute.'} />
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
          <p className="m-0 text-sm text-muted">Prices include 18% GST. Longer rentals: 10% off from 3 days, 20% from 7, 35% from 28.</p>
        </section>
        <RelatedLinks links={[SEO_LINKS.scooty, SEO_LINKS.enfield, SEO_LINKS.adventure, SEO_LINKS.places, SEO_LINKS.pickup, SEO_LINKS.faq]} />
      </main>
    </div>
  );
}
