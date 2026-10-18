import type { MetadataRoute } from 'next';
import type { RouteGuideDTO, VehicleModelDTO } from '@valleyride/shared';
import { api } from '@/lib/api-client';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const pages = ['', '/fleet', '/routes', '/invest', '/terms'].map((p) => ({ url: `${site}${p}` }));
  // The sitemap should never fail a build or a crawl just because the API is briefly down.
  const [models, routes] = await Promise.all([
    api.get<VehicleModelDTO[]>('/vehicle-models').catch(() => []),
    api.get<RouteGuideDTO[]>('/routes').catch(() => []),
  ]);
  return [
    ...pages,
    ...models.map((m) => ({ url: `${site}/fleet/${m.slug}` })),
    ...routes.map((r) => ({ url: `${site}/routes/${r.slug}` })),
  ];
}
