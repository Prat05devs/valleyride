import { GST_PCT, MIN_HOURS } from '@valleyride/shared';
import { formatPaise } from '@/lib/format';
import { abs, ADDRESS_LINE, BUSINESS, getModelsSafe, getRoutesSafe, routeName } from '@/lib/seo';
import { DISCOUNT_LINE, generalFaqs, PLACES } from '@/lib/seo-content';

export const revalidate = 3600;

/**
 * /llms.txt (llmstxt.org): a plain Markdown summary of the business for AI assistants and agents, built from the
 * same facts as the pages and the structured data, with live prices when the catalogue is available.
 */
export async function GET() {
  const [models, routes] = await Promise.all([getModelsSafe(), getRoutesSafe()]);
  const p = BUSINESS.pickup;
  const contact = [BUSINESS.phone && `- Desk phone: ${BUSINESS.phone}`, BUSINESS.whatsapp && `- WhatsApp: ${BUSINESS.whatsapp}`, BUSINESS.email && `- Email: ${BUSINESS.email}`].filter(Boolean);
  const fleet = models.length
    ? models.map((m) => `- [${m.name}](${abs(`/fleet/${m.slug}`)}): ${formatPaise(m.pricePerDayPaise)} a day including GST, ${m.kmPerDay} km a day included, ${formatPaise(m.extraKmPaise)} per extra km, ${formatPaise(m.depositPaise)} refundable deposit.`)
    : ['- Honda Activa 125 (gearless scooter), Royal Enfield Hunter 350, Royal Enfield Scram 440 and Royal Enfield Himalayan 450. Live prices: ' + abs('/fleet')];
  const lines = [
    '# Valley Ride',
    '',
    `> Valley Ride rents scooters and Royal Enfield motorcycles in Dehradun, Uttarakhand, India, by the day, week or month, for city riding and for rides to Mussoorie, Rishikesh, Dhanaulti, Chakrata and the Garhwal Himalaya. Book at ${abs('/')} or in the Valley Ride app.`,
    '',
    '## Pickup and return',
    `- One pickup and return point: ${ADDRESS_LINE}.`,
    `- Map: ${p.mapUrl} (${p.lat}, ${p.lng})`,
    `- ${p.hours.label} (IST). Bikes are returned to the same point; there are no one-way returns.`,
    ...contact,
    '',
    '## Fleet and prices',
    ...fleet,
    `- Prices include ${GST_PCT}% GST. ${DISCOUNT_LINE}`,
    `- Minimum booking ${MIN_HOURS} hours; rent is charged per started 24 hours.`,
    '',
    '## Booking rules',
    '- Pay online by UPI or card (Razorpay). The bike is held for 15 minutes while you pay.',
    '- Bring an original two-wheeler driving licence (MCWG for the Royal Enfields; MCWOG or MCWG for the Activa) and an ID proof.',
    '- Cancellation more than 24 hours before pickup: full rent refunded; within 24 hours: 50%. The deposit is always refunded.',
    '- The deposit is refunded to the same UPI or card after inspection at return; only damage is deducted.',
    '- Helmets are compulsory for rider and pillion.',
    '',
    '## Pages',
    `- [Bike on rent in Dehradun](${abs('/bike-rental-dehradun')})`,
    `- [Scooty on rent in Dehradun](${abs('/scooty-rental-dehradun')})`,
    `- [Royal Enfield on rent in Dehradun](${abs('/royal-enfield-rental-dehradun')})`,
    `- [Fleet and prices](${abs('/fleet')})`,
    `- [Places to visit near Dehradun by bike](${abs('/places-to-visit-near-dehradun')})`,
    `- [Pickup point: Dorm Hub, Sahastradhara Road](${abs('/pickup-location')})`,
    `- [FAQ](${abs('/faq')})`,
    `- [Hindi: देहरादून में बाइक किराये पर](${abs('/hi/bike-rental-dehradun')})`,
    `- [Rental terms](${abs('/terms')})`,
    '',
    '## Route guides from Dehradun',
    ...(routes.length
      ? routes.map((r) => `- [${routeName(r.title)} by bike](${abs(`/routes/${r.slug}`)}): ${r.distanceKm} km${r.rideTime ? `, ${r.rideTime}` : ''}.`)
      : [`- ${abs('/routes')}`]),
    '',
    '## Places to ride from Dehradun',
    ...PLACES.flatMap((g) => g.places).map((pl) => `- ${pl.name}: ${pl.distance}; ${pl.time}; best bike ${pl.bikes}; ${pl.season}.`),
    '',
    '## FAQ',
    ...generalFaqs(models).flatMap((f) => [`### ${f.q}`, f.a, '']),
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
