import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://valleyride.in' : 'http://localhost:3000');
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/account', '/admin', '/checkout', '/invest/portal'] },
    sitemap: `${site}/sitemap.xml`,
  };
}
