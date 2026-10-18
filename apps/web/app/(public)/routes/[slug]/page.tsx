import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DIFFICULTY_LABEL, STOP_KIND_LABEL, type Photo, type RouteGuideDTO, type RouteStop, type VehicleModelDTO } from '@valleyride/shared';
import { RouteArt } from '@/components/brand/art';
import { SiteHeader } from '@/components/layout/site-header';
import { api, ApiError, mediaUrl } from '@/lib/api-client';
import { bikePhoto, shortName } from '@/lib/bikes';
import { formatPaise } from '@/lib/format';
import { ROUTE_META } from '@/lib/routes';

export const revalidate = 3600;

async function getRoute(slug: string) {
  try { return await api.get<RouteGuideDTO>(`/routes/${encodeURIComponent(slug)}`); }
  catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await getRoute((await params).slug);
  const first = r.bodyMd.split('\n')[0]!;
  return {
    title: `${r.title} by bike`,
    description: `${r.distanceKm} km. ${first.length > 150 ? `${first.slice(0, 147)}…` : first}`,
    openGraph: r.cover ? { images: [mediaUrl(r.cover.url)] } : undefined,
  };
}

/** Guide text comes from route_guides.body_md (CMS). Paragraphs, and "- Stop — note" lines as a fallback timeline. */
function parse(md: string) {
  const blocks = md.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const steps = blocks.flatMap((b) => b.split('\n')).filter((l) => l.startsWith('- ')).map((l) => {
    const [title, note] = l.slice(2).split(/\s+—\s+/);
    return { title: title!, note: note ?? '' };
  });
  return { paragraphs: blocks.filter((b) => !b.startsWith('- ')), steps };
}

function StopPhoto({ stop, className }: { stop: RouteStop; className: string }) {
  if (!stop.photo) return null;
  return (
    <figure className="m-0 flex flex-col gap-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl(stop.photo.url)} alt={stop.name} loading="lazy" className={`w-full rounded-[22px] bg-field object-cover ${className}`} />
    </figure>
  );
}

function Meta({ stop }: { stop: RouteStop }) {
  return (
    <>
      {stop.hours && <p className="m-0 flex items-center gap-1.5 text-sm text-muted"><span aria-hidden="true">◷</span>{stop.hours}</p>}
      {stop.tip && <p className="m-0 rounded-2xl bg-orange-tint px-3.5 py-2.5 text-[15px] leading-normal text-orange-ink"><span className="font-medium">Tip: </span>{stop.tip}</p>}
    </>
  );
}

/** Photo and map credits, gathered in one line at the foot of the page rather than on the images. */
function Credits({ route }: { route: RouteGuideDTO }) {
  const photos = [route.cover, ...route.stops.map((s) => s.photo)].filter((p): p is Photo => !!p);
  const seen = new Set<string>();
  const unique = photos.filter((p) => (seen.has(p.url) ? false : (seen.add(p.url), true)));
  if (!unique.length && !route.mapImage) return null;
  return (
    <p className="m-0 px-2 text-xs leading-relaxed text-muted">
      {unique.length > 0 && <>Photos via Wikimedia Commons: {unique.map((p, i) => (
        <span key={p.url}>{i > 0 && '; '}{p.source ? <a href={p.source} target="_blank" rel="noreferrer" className="underline">{p.credit}</a> : p.credit}{p.license && ` (${p.license})`}</span>
      ))}. </>}
      {route.mapImage && <>Map relief from SRTM elevation data; roads © OpenStreetMap contributors.</>}
    </p>
  );
}

export default async function RouteGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const r = await getRoute((await params).slug);
  const models = await api.get<VehicleModelDTO[]>('/vehicle-models');
  const bikes = r.recommendedModels.map((id) => models.find((m) => m.id === id)).filter(Boolean) as VehicleModelDTO[];
  const meta = ROUTE_META[r.slug];
  const { paragraphs, steps } = parse(r.bodyMd);
  const way = r.stops.filter((s) => s.section === 'way');
  const explore = r.stops.filter((s) => s.section === 'explore');
  const eat = r.stops.filter((s) => s.section === 'eat');
  const chips = [`${r.distanceKm} km`, r.rideTime ?? (meta?.time && `About ${meta.time}`), r.difficulty && DIFFICULTY_LABEL[r.difficulty]].filter(Boolean) as string[];

  return (
    <div className="pb-20">
      <section className="relative min-h-[560px] overflow-hidden rounded-b-[48px] bg-hero text-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.cover ? mediaUrl(r.cover.url) : '/images/photo-cover.jpg'} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_60%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.2)_45%,rgba(0,0,0,0.75)_100%)]" />
        <SiteHeader variant="dark" active="routes" />
        <div className="relative mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pb-14 pt-[150px] sm:px-6">
          <Link href="/routes" className="text-[15px] text-white/85 underline">All routes</Link>
          <h1 className="m-0 text-[clamp(40px,5.5vw,68px)] font-normal tracking-[-1.2px]">{r.title}</h1>
          <div className="flex flex-wrap gap-2">{chips.map((c) => <span key={c} className="inline-flex h-9 items-center rounded-full border border-white/30 bg-white/[0.18] px-4 text-[15px] first-letter:uppercase">{c}</span>)}</div>
        </div>
      </section>
      <main className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-6 px-4 pt-12 sm:px-6">
        <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <div className="flex flex-col gap-1 rounded-[36px] bg-surface p-8">
            <h2 className="m-0 mb-4 text-[30px] font-normal">The ride</h2>
            {paragraphs.map((p) => <p key={p} className="m-0 mb-3 text-[17px] leading-[1.6] text-body">{p}</p>)}
            {r.highlights.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">{r.highlights.map((h) => <span key={h} className="inline-flex min-h-9 items-center rounded-full bg-field px-4 py-1.5 text-[15px]">{h}</span>)}</div>
            )}
            {way.length === 0 && steps.map((s, i) => (
              <div key={s.title} className="flex gap-[18px]">
                <div className="flex flex-col items-center">
                  <span className={`mt-[5px] h-3.5 w-3.5 rounded-full ${i === 0 ? 'bg-ink' : i === steps.length - 1 ? 'bg-orange' : 'border-2 border-ink'}`} />
                  {i < steps.length - 1 && <span className="w-0.5 flex-1 bg-line" />}
                </div>
                <div className="pb-[22px]"><div className="text-[19px]">{s.title}</div>{s.note && <div className="mt-0.5 text-base text-muted">{s.note}</div>}</div>
              </div>
            ))}
          </div>

          {way.length > 0 && (
            <section className="flex flex-col rounded-[36px] bg-surface p-8">
              <h2 className="m-0 mb-5 text-[30px] font-normal">Along the way</h2>
              {r.mapImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(r.mapImage)} alt={`Map of the ${r.title} route`} className="mb-8 aspect-[16/10] w-full rounded-[24px] bg-field object-cover" />
              )}
              {way.map((s, i) => (
                <div key={s.name} className="flex gap-[18px]">
                  <div className="flex w-12 flex-none flex-col items-center">
                    <span className="text-sm text-muted">{s.km !== null ? `${s.km} km` : ''}</span>
                    <span className={`mt-1.5 h-3.5 w-3.5 flex-none rounded-full ${i === 0 ? 'bg-ink' : i === way.length - 1 ? 'bg-orange' : 'border-2 border-ink'}`} />
                    {i < way.length - 1 && <span className="w-0.5 flex-1 bg-line" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5 pb-8">
                    <div>
                      <span className="text-[13px] uppercase tracking-[0.6px] text-muted">{STOP_KIND_LABEL[s.kind]}</span>
                      <h3 className="m-0 text-[21px] font-normal">{s.name}</h3>
                    </div>
                    <p className="m-0 text-base leading-[1.6] text-body">{s.blurb}</p>
                    <Meta stop={s} />
                    <StopPhoto stop={s} className="aspect-[16/9]" />
                  </div>
                </div>
              ))}
            </section>
          )}

          {explore.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="m-0 px-2 text-[30px] font-normal">What to see and explore</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4">
                {explore.map((s) => (
                  <div key={s.name} className="flex flex-col gap-3 rounded-[32px] bg-surface p-5">
                    <StopPhoto stop={s} className="aspect-[4/3]" />
                    <div>
                      <span className="text-[13px] uppercase tracking-[0.6px] text-muted">{STOP_KIND_LABEL[s.kind]}</span>
                      <h3 className="m-0 text-xl font-normal">{s.name}</h3>
                    </div>
                    <p className="m-0 text-[15px] leading-[1.6] text-body">{s.blurb}</p>
                    <Meta stop={s} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {eat.length > 0 && (
            <section className="flex flex-col gap-4 rounded-[36px] bg-surface p-8">
              <h2 className="m-0 text-[30px] font-normal">Cafés and food</h2>
              {eat.map((s) => (
                <div key={s.name} className="flex flex-wrap gap-4 border-t border-line pt-4 first-of-type:border-0 first-of-type:pt-0">
                  {s.photo && <div className="w-[160px] flex-none"><StopPhoto stop={s} className="aspect-square" /></div>}
                  <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
                    <span className="text-[13px] uppercase tracking-[0.6px] text-muted">{STOP_KIND_LABEL[s.kind]}</span>
                    <h3 className="m-0 text-xl font-normal">{s.name}</h3>
                    <p className="m-0 text-[15px] leading-[1.6] text-body">{s.blurb}</p>
                    <Meta stop={s} />
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className="flex flex-col gap-2.5 rounded-[36px] bg-orange-tint p-8 text-orange-ink">
            <h2 className="m-0 text-[26px] font-normal text-ink">Ride safe</h2>
            <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[17px] leading-[1.6]">
              <li>Helmets are compulsory for rider and pillion.</li>
              {r.tips.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          {r.stops.some((s) => s.hours) && <p className="m-0 px-2 text-sm text-muted">Opening hours change with the season. Check locally before you set off.</p>}
          <Credits route={r} />
        </article>
        <aside className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 lg:sticky lg:top-6">
          {!r.mapImage && <div className="rounded-[36px] bg-surface p-5"><RouteArt kind={meta?.kind ?? 'climb'} height={180} /></div>}
          {(r.bestTime || r.rideTime) && (
            <div className="flex flex-col gap-3 rounded-[36px] bg-surface p-6">
              {r.rideTime && <div><div className="text-sm text-muted">Ride time</div><div className="text-lg">{r.rideTime}</div></div>}
              {r.bestTime && <div><div className="text-sm text-muted">Best time to go</div><div className="text-lg">{r.bestTime}</div></div>}
            </div>
          )}
          <div className="flex flex-col gap-3.5 rounded-[36px] bg-surface p-6">
            <h2 className="m-0 text-2xl font-normal">Best bikes for this route</h2>
            {r.bikeAdvice && <p className="m-0 text-[15px] leading-[1.6] text-body">{r.bikeAdvice}</p>}
            {bikes.map((m) => (
              <Link key={m.id} href={`/fleet/${m.slug}`} className="flex items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="flex h-[76px] w-[110px] flex-none items-center justify-center rounded-[20px] bg-field"><img src={bikePhoto(m.slug)} alt={m.name} className="h-16 w-24 object-contain" /></span>
                <span className="flex-1">
                  <span className="block text-lg">{shortName(m.name)}</span>
                  <span className="text-[15px] text-muted">{formatPaise(m.pricePerDayPaise)}/day · {m.specs ? m.specs.highlights[0]?.value : `${m.engineCc} cc`} · {m.kmPerDay} km/day</span>
                </span>
              </Link>
            ))}
            <Link href="/book" className="mt-1.5 flex h-14 items-center justify-center rounded-full bg-ink text-[17px] text-surface">Book a bike for this ride</Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
