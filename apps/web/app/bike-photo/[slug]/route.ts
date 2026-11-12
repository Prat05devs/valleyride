import { mediaUrl } from '@/lib/api-client';
import { bundledPhoto } from '@/lib/bikes';
import { getModelsSafe } from '@/lib/seo';

/**
 * /bike-photo/<slug>: redirects to the model's uploaded photo, else its bundled cut-out. Used where only the slug is
 * known (bookings, checkout). The model list is cached for five minutes, and so is the redirect.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = (await getModelsSafe()).find((m) => m.slug === slug);
  const target = model?.images?.[0] ? mediaUrl(model.images[0]) : bundledPhoto(slug);
  return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'public, max-age=300, s-maxage=300' } });
}
