import type { MetadataRoute } from 'next';
import { abs, getModelsSafe, getRoutesSafe } from '@/lib/seo';

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/** Static pages first (they never depend on the API), then bikes and route guides from the catalogue. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: Entry['changeFrequency'], languages?: Record<string, string>): Entry => ({
    url: abs(path), lastModified: now, changeFrequency, priority,
    ...(languages ? { alternates: { languages: Object.fromEntries(Object.entries(languages).map(([k, v]) => [k, abs(v)])) } } : {}),
  });
  const bikeLangs = { 'en-IN': '/bike-rental-dehradun', 'hi-IN': '/hi/bike-rental-dehradun' };
  // The sitemap should never fail a build or a crawl just because the API is briefly down.
  const [models, routes] = await Promise.all([getModelsSafe(), getRoutesSafe()]);
  return [
    page('/', 1, 'daily'),
    page('/bike-rental-dehradun', 0.95, 'weekly', bikeLangs),
    page('/hi/bike-rental-dehradun', 0.8, 'weekly', bikeLangs),
    page('/scooty-rental-dehradun', 0.9, 'weekly'),
    page('/royal-enfield-rental-dehradun', 0.9, 'weekly'),
    page('/adventure-bike-rental-dehradun', 0.9, 'weekly'),
    page('/fleet', 0.9, 'daily'),
    page('/places-to-visit-near-dehradun', 0.85, 'monthly'),
    page('/routes', 0.8, 'weekly'),
    page('/pickup-location', 0.8, 'monthly'),
    page('/faq', 0.75, 'monthly'),
    page('/terms', 0.3, 'yearly'),
    page('/privacy', 0.3, 'yearly'),
    page('/refund-policy', 0.3, 'yearly'),
    page('/shipping-policy', 0.3, 'yearly'),
    page('/contact', 0.3, 'yearly'),
    page('/delete-account', 0.3, 'yearly'),
    page('/invest', 0.7, 'monthly'),
    ...models.map((m) => page(`/fleet/${m.slug}`, 0.85, 'daily')),
    ...routes.map((r) => page(`/routes/${r.slug}`, 0.8, 'monthly')),
  ];
}
