import Link from 'next/link';
import type { RouteGuideDTO, VehicleSpecs } from '@valleyride/shared';

function Score({ score }: { score: number }) {
  return (
    <span className="flex gap-1" role="img" aria-label={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`h-2 w-7 rounded-full ${i <= score ? 'bg-ink' : 'bg-field'}`} />)}
    </span>
  );
}

/** The model page's editorial half: overview, spec sheet, mileage, terrain fit and the routes it is recommended for. */
export function ModelSpecs({ name, specs, goodFor, use }: { name: string; specs: VehicleSpecs; goodFor: RouteGuideDTO[]; use?: string }) {
  const m = specs.mileage;
  return (
    <>
      <section className="flex flex-col gap-4 rounded-[36px] bg-surface p-7">
        <span className="inline-flex h-8 w-fit items-center rounded-full bg-orange-tint px-3.5 text-sm text-orange-ink">{specs.modelYear} model · new</span>
        <h2 className="m-0 text-[26px] font-normal">About the {name}</h2>
        <p className="m-0 text-[17px] leading-[1.6] text-body">{specs.overview}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(140px,100%),1fr))] gap-3">
          {specs.highlights.map((h) => (
            <div key={h.label} className="rounded-tile bg-field p-4"><div className="text-[22px] font-medium">{h.value}</div><div className="text-sm text-muted">{h.label}</div></div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[36px] bg-surface p-7">
        <h2 className="m-0 text-[26px] font-normal">Fuel economy</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-3">
          {[
            ...(m.claimed ? [['Claimed', m.claimed]] : []), ['Real-world', m.realWorld], ['Fuel tank', `${m.tankL} litres`], ['Range', m.range],
          ].map(([l, v]) => <div key={l} className="rounded-tile bg-field p-4"><div className="text-lg font-medium">{v}</div><div className="text-sm text-muted">{l}</div></div>)}
        </div>
        {m.note && <p className="m-0 text-[15px] leading-normal text-muted">{m.note}</p>}
      </section>

      <section className="flex flex-col gap-5 rounded-[36px] bg-surface p-7">
        <div>
          <h2 className="m-0 text-[26px] font-normal">How it handles Doon roads</h2>
          {use && <p className="m-0 mt-1.5 text-base text-muted">Best for: {use}</p>}
        </div>
        {specs.terrain.map((t) => (
          <div key={t.label} className="flex flex-col gap-1.5 border-t border-line pt-4 first-of-type:border-0 first-of-type:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-lg">{t.label}</span><Score score={t.score} /></div>
            <p className="m-0 text-[15px] leading-normal text-body">{t.note}</p>
          </div>
        ))}
        {goodFor.length > 0 && (
          <div className="flex flex-col gap-2.5 border-t border-line pt-4">
            <span className="text-lg">Recommended for these routes</span>
            <div className="flex flex-wrap gap-2.5">
              {goodFor.map((r) => <Link key={r.id} href={`/routes/${r.slug}`} className="inline-flex h-11 items-center rounded-full bg-orange-tint px-[18px] text-[15px] text-orange-ink">{r.title}</Link>)}
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-[36px] bg-surface p-7">
        <h2 className="m-0 mb-2 text-[26px] font-normal">Specifications</h2>
        {specs.groups.map((g, i) => (
          <details key={g.title} open={i < 2} className="group border-t border-line py-3 first-of-type:border-0">
            <summary className="flex cursor-pointer list-none items-center justify-between text-lg [&::-webkit-details-marker]:hidden">
              {g.title}<span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <dl className="m-0 mt-3 grid grid-cols-[minmax(120px,40%)_1fr] gap-x-4 gap-y-2.5">
              {g.rows.map((r) => <div key={r.label} className="contents"><dt className="text-[15px] text-muted">{r.label}</dt><dd className="m-0 text-[15px]">{r.value}</dd></div>)}
            </dl>
          </details>
        ))}
      </section>

      {(specs.goodToKnow.length > 0 || specs.fromUs.length > 0) && (
        <section className="flex flex-col gap-3 rounded-[36px] bg-orange-tint p-7 text-orange-ink">
          <h2 className="m-0 text-[26px] font-normal text-ink">Good to know</h2>
          <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-base leading-normal">
            {[...specs.fromUs, ...specs.goodToKnow].map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>
      )}

      {specs.sources.length > 0 && (
        <p className="m-0 px-2 text-sm leading-normal text-muted">
          Specifications from {specs.sources.map((s, i) => <span key={s.url}>{i > 0 && ', '}<a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.label}</a></span>)}.
          {' '}Figures can differ slightly by variant.
        </p>
      )}
    </>
  );
}
