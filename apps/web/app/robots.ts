import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/** Private areas stay out of every index. */
const PRIVATE = ['/account', '/admin', '/checkout', '/invest/portal', '/invest/onboarding', '/login'];

/**
 * Search engines and AI assistants are welcome: answers in ChatGPT, Claude, Perplexity, Gemini and Google's AI
 * Overviews come from these crawlers. They are named explicitly so a later blanket rule cannot shut them out by accident.
 */
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot', 'meta-externalagent', 'DuckAssistBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: ['/', '/llms.txt'], disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
