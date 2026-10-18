'use client';

import { routeGuideInputSchema, vehicleSpecsSchema, type RouteGuideDTO, type VehicleModelDTO } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageTitle, Panel } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';
import { shortName } from '@/lib/bikes';
import { cn } from '@/lib/utils';
import { firstIssue } from '@/lib/zod-issue';

type Draft = {
  id: string; slug: string; title: string; distanceKm: number; bodyMd: string; recommendedModels: string[];
  rideTime: string; bestTime: string; difficulty: '' | 'easy' | 'moderate' | 'challenging'; bikeAdvice: string;
  highlights: string; tips: string; stopsJson: string; mapImage: string;
};

const EMPTY: Draft = {
  id: '', slug: '', title: '', distanceKm: 10, bodyMd: '', recommendedModels: [],
  rideTime: '', bestTime: '', difficulty: '', bikeAdvice: '', highlights: '', tips: '', mapImage: '', stopsJson: '{\n  "cover": null,\n  "stops": []\n}',
};

const STOPS_HELP = `{
  "cover": { "url": "/static/guides/lal-tibba.jpg", "credit": "Photographer", "license": "CC BY-SA 4.0", "source": "https://…" },
  "stops": [
    { "name": "Maggi points", "kind": "viewpoint", "section": "way", "km": 14,
      "blurb": "What riders see and do here.", "tip": "Optional", "hours": "Optional",
      "photo": { "url": "https://…", "credit": "…", "license": "…" } }
  ]
}
kind: start, junction, viewpoint, food, cafe, sight, waterfall, temple, walk, fuel, end
section: way (timeline, needs km), explore (things to see), eat (cafés and food)`;

const toDraft = (r: RouteGuideDTO): Draft => ({
  id: r.id, slug: r.slug, title: r.title, distanceKm: r.distanceKm, bodyMd: r.bodyMd, recommendedModels: r.recommendedModels,
  rideTime: r.rideTime ?? '', bestTime: r.bestTime ?? '', difficulty: r.difficulty ?? '', bikeAdvice: r.bikeAdvice ?? '',
  highlights: r.highlights.join('\n'), tips: r.tips.join('\n'), mapImage: r.mapImage ?? '', stopsJson: JSON.stringify({ cover: r.cover, stops: r.stops }, null, 2),
});
const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const orNull = (s: string) => s.trim() || null;

/**
 * Ride-discovery CMS: the route pages on the website and in the app. Paragraphs of guide text, the stop-by-stop
 * timeline, places to explore, cafés, photos with credits and riding tips. Public pages pick up changes immediately.
 */
export default function ContentPage() {
  const [tab, setTab] = useState<'routes' | 'models'>('routes');
  return (
    <>
      <PageTitle title="Content" sub="Route guides and model pages on the website and in the app" />
      <div role="tablist" className="flex gap-2">
        {([['routes', 'Route guides'], ['models', 'Model pages']] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('h-10 rounded-full px-4 text-sm', tab === k ? 'bg-ink text-surface' : 'bg-surface')}>{l}</button>
        ))}
      </div>
      {tab === 'routes' ? <RouteGuides /> : <ModelPages />}
    </>
  );
}

function RouteGuides() {
  const qc = useQueryClient();
  const guides = useQuery({ queryKey: ['admin', 'routes'], queryFn: () => api.get<RouteGuideDTO[]>('/admin/routes') });
  const models = useQuery({ queryKey: ['models'], queryFn: () => api.get<VehicleModelDTO[]>('/vehicle-models') });
  const [g, setG] = useState<Draft>(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  async function save() {
    setMsg(null);
    let extra: { cover?: unknown; stops?: unknown };
    try { extra = JSON.parse(g.stopsJson || '{}'); } catch { setMsg('Stops and photos: the JSON is not valid.'); return; }
    const parsed = routeGuideInputSchema.safeParse({
      slug: g.slug, title: g.title, distanceKm: Number(g.distanceKm), bodyMd: g.bodyMd, recommendedModels: g.recommendedModels,
      rideTime: orNull(g.rideTime), bestTime: orNull(g.bestTime), difficulty: g.difficulty || null, bikeAdvice: orNull(g.bikeAdvice),
      highlights: lines(g.highlights), tips: lines(g.tips), mapImage: orNull(g.mapImage), cover: extra.cover ?? null, stops: extra.stops ?? [],
    });
    if (!parsed.success) { setMsg(firstIssue(parsed.error)); return; }
    try {
      const saved = g.id ? await api.patch<RouteGuideDTO>(`/admin/routes/${g.id}`, parsed.data) : await api.post<RouteGuideDTO>('/admin/routes', parsed.data);
      setG(toDraft(saved)); setMsg('Saved and live');
      qc.invalidateQueries({ queryKey: ['admin', 'routes'] });
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not save'); }
  }
  const toggle = (id: string) => setG({ ...g, recommendedModels: g.recommendedModels.includes(id) ? g.recommendedModels.filter((x) => x !== id) : [...g.recommendedModels, id] });
  const set = <K extends keyof Draft>(k: K) => (e: { target: { value: string } }) => setG({ ...g, [k]: e.target.value });

  return (
    <div className="flex flex-wrap items-start gap-4">
        <Panel className="flex-[1_1_260px] gap-1.5">
          {guides.data?.map((r) => (
            <button key={r.id} type="button" onClick={() => { setG(toDraft(r)); setMsg(null); }} className={cn('rounded-[20px] p-3.5 text-left', g.id === r.id ? 'bg-ink text-surface' : 'hover:bg-field')}>
              <span className="block">{r.title}</span><span className="text-[13px] opacity-75">/{r.slug} · {r.distanceKm} km · {r.stops.length} stops</span>
            </button>
          ))}
          <Button variant="field" size="sm" onClick={() => { setG(EMPTY); setMsg(null); }}>New guide</Button>
        </Panel>
        <form className="flex min-w-0 flex-[999_1_460px] flex-col gap-3 rounded-sheet bg-surface p-[22px]" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <h2 className="m-0 text-xl font-normal">{g.id ? 'Edit guide' : 'New guide'}</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-2.5">
            <label className="label">Title<Input value={g.title} onChange={set('title')} /></label>
            <label className="label">Slug (URL)<Input value={g.slug} onChange={(e) => setG({ ...g, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></label>
            <label className="label">Distance (km)<Input inputMode="numeric" value={String(g.distanceKm)} onChange={(e) => setG({ ...g, distanceKm: Number(e.target.value.replace(/\D/g, '') || 0) })} /></label>
            <label className="label">Ride time<Input value={g.rideTime} onChange={set('rideTime')} placeholder="1.5–2 h one way" /></label>
            <label className="label">Difficulty
              <Select value={g.difficulty} onChange={set('difficulty')}>
                <option value="">Not set</option><option value="easy">Easy</option><option value="moderate">Moderate</option><option value="challenging">Challenging</option>
              </Select>
            </label>
            <label className="label">Best time to go<Input value={g.bestTime} onChange={set('bestTime')} placeholder="October to June, early morning" /></label>
            <label className="label">Route map image<Input value={g.mapImage} onChange={set('mapImage')} placeholder="/static/guides/maps/route.jpg" /></label>
          </div>
          <label className="label">Guide text<Textarea className="min-h-[180px]" value={g.bodyMd} onChange={set('bodyMd')}
            placeholder={'Two or three paragraphs about the ride, separated by a blank line.'} /></label>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-2.5">
            <label className="label">Highlights (one per line)<Textarea className="min-h-[130px]" value={g.highlights} onChange={set('highlights')} /></label>
            <label className="label">Riding tips (one per line)<Textarea className="min-h-[130px]" value={g.tips} onChange={set('tips')} /></label>
          </div>
          <div className="flex flex-col gap-2"><span className="text-sm text-muted">Best bikes for this route</span>
            <div className="flex flex-wrap gap-2">{models.data?.map((m) => <button key={m.id} type="button" aria-pressed={g.recommendedModels.includes(m.id)} onClick={() => toggle(m.id)} className={cn('h-10 rounded-full px-4 text-sm', g.recommendedModels.includes(m.id) ? 'bg-ink text-surface' : 'bg-field')}>{shortName(m.name)}</button>)}</div>
          </div>
          <label className="label">Why these bikes<Textarea className="min-h-[90px]" value={g.bikeAdvice} onChange={set('bikeAdvice')} /></label>
          <label className="label">
            <span className="flex items-center justify-between gap-3">Stops, cafés and photos (JSON)
              <button type="button" className="text-sm underline" onClick={() => setShowHelp((v) => !v)}>{showHelp ? 'Hide format' : 'Show format'}</button>
            </span>
            {showHelp && <pre className="m-0 overflow-x-auto whitespace-pre rounded-2xl bg-field p-3 text-xs">{STOPS_HELP}</pre>}
            <Textarea className="min-h-[320px] font-mono text-[13px]" spellCheck={false} value={g.stopsJson} onChange={set('stopsJson')} />
          </label>
          {msg && <p role="status" className="m-0 text-sm text-muted">{msg}</p>}
          <div className="flex gap-2"><Button type="submit" disabled={g.title.length < 3 || g.slug.length < 3 || g.bodyMd.length < 10}>Save</Button>
            {g.id && <a href={`/routes/${g.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-[50px] items-center rounded-full bg-field px-5">View on the website</a>}</div>
        </form>
    </div>
  );
}

/**
 * Model pages: the spec sheet, mileage, terrain scores and "good to know" lines, as JSON validated against the shared
 * schema. "fromUs" is for the owner's own facts (helmets included, phone mount, variant, colour).
 */
function ModelPages() {
  const qc = useQueryClient();
  const models = useQuery({ queryKey: ['models'], queryFn: () => api.get<VehicleModelDTO[]>('/vehicle-models') });
  const [id, setId] = useState('');
  const [json, setJson] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const m = models.data?.find((x) => x.id === id);

  function pick(next: VehicleModelDTO) { setId(next.id); setJson(JSON.stringify(next.specs, null, 2)); setMsg(null); }
  async function save() {
    setMsg(null);
    let raw: unknown;
    try { raw = JSON.parse(json); } catch { setMsg('The JSON is not valid.'); return; }
    const parsed = vehicleSpecsSchema.safeParse(raw);
    if (!parsed.success) { setMsg(firstIssue(parsed.error)); return; }
    try {
      const saved = await api.put<VehicleModelDTO>(`/admin/vehicle-models/${id}/specs`, parsed.data);
      setJson(JSON.stringify(saved.specs, null, 2)); setMsg('Saved and live');
      qc.invalidateQueries({ queryKey: ['models'] });
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not save'); }
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <Panel className="flex-[1_1_260px] gap-1.5">
        {models.data?.map((x) => (
          <button key={x.id} type="button" onClick={() => pick(x)} className={cn('rounded-[20px] p-3.5 text-left', id === x.id ? 'bg-ink text-surface' : 'hover:bg-field')}>
            <span className="block">{shortName(x.name)}</span><span className="text-[13px] opacity-75">{x.specs ? `${x.specs.modelYear} model · ${x.specs.fromUs.length ? 'with' : 'no'} owner notes` : 'No specs yet'}</span>
          </button>
        ))}
      </Panel>
      <form className="flex min-w-0 flex-[999_1_460px] flex-col gap-3 rounded-sheet bg-surface p-[22px]" onSubmit={(e) => { e.preventDefault(); save(); }}>
        {!m ? <p className="m-0 text-muted">Pick a model to edit its page.</p> : (
          <>
            <h2 className="m-0 text-xl font-normal">{m.name}</h2>
            <p className="m-0 text-sm text-muted">
              Add your own facts to <code>fromUs</code> (for example helmets included, phone mount, the variant you bought); they show first under Good to know.
              Terrain scores run from 1 to 5.
            </p>
            <Textarea className="min-h-[520px] font-mono text-[13px]" spellCheck={false} value={json} onChange={(e) => setJson(e.target.value)} />
            {msg && <p role="status" className="m-0 text-sm text-muted">{msg}</p>}
            <div className="flex gap-2"><Button type="submit">Save</Button>
              <a href={`/fleet/${m.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-[50px] items-center rounded-full bg-field px-5">View on the website</a></div>
          </>
        )}
      </form>
    </div>
  );
}
