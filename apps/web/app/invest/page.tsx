import type { Metadata } from 'next';
import { Calculator } from '@/components/investor/calculator';
import { PhotoHero } from '@/components/layout/photo-hero';
import { SiteFooter } from '@/components/layout/site-footer';
import { Breadcrumbs, Card, FaqList, P, RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { INVEST_PHONE_DISPLAY, INVEST_TEL_URL, investWhatsAppUrl } from '@/lib/legal';
import { breadcrumbJsonLd, faqJsonLd, JsonLd, pageMetadata } from '@/lib/seo';
import { investFaqs } from '@/lib/seo-content';

const PATH = '/invest';

export const metadata: Metadata = pageMetadata({
  title: 'Valley Ride Capital: Invest in a Dehradun Bike Rental Fleet',
  absoluteTitle: true,
  description: 'Invest ₹1 lakh or ₹2.5 lakh in Valley Ride\'s bike rental fleet in Dehradun: 20% a year paid monthly, principal back after 18 months. Not a bank deposit.',
  path: PATH,
  keywords: ['Valley Ride Capital', 'invest in bike rental business', 'bike rental investment Dehradun', 'two wheeler fleet investment India',
    'monthly interest investment Uttarakhand', 'invest in Dehradun business', 'Valley Ride investment', 'fleet financing investment'],
});

const STEPS = [
  ['Choose a plan', '₹1 lakh or ₹2.5 lakh. Both pay 20% a year, with a fixed 18-month lock-in.'],
  ['Message the team', `On WhatsApp or by phone at ${INVEST_PHONE_DISPLAY}. We answer your questions and share the agreement.`],
  ['Sign and transfer', 'Sign the agreement and transfer the amount to the bank account it names. Interest starts from the date we receive it.'],
  ['Get paid every month', 'Interest reaches your bank account every month for 18 months; your principal comes back with the last payment.'],
] as const;

export default function InvestPage() {
  const faqs = investFaqs();
  return (
    <div className="pb-0">
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Valley Ride Capital', path: PATH }]), faqJsonLd(faqs)]} />
      <PhotoHero active="capital" photos={['weekend', 'touring']} position="58% center" minH={560}>
        <Breadcrumbs dark items={[{ name: 'Valley Ride Capital' }]} />
        <h1 className="m-0 max-w-[860px] text-[clamp(38px,5.5vw,68px)] font-normal leading-[1.05] tracking-[-1.2px]">Invest in Valley Ride&apos;s bike rental fleet in Dehradun</h1>
        <p className="m-0 max-w-[660px] text-[19px] leading-normal text-white/85">Fund the expansion of a professionally managed two-wheeler fleet serving travellers and adventure riders across Uttarakhand. Two plans, ₹1 lakh or ₹2.5 lakh, at 20% a year: interest every month and your principal back after 18 months.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <a href={investWhatsAppUrl()} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full bg-surface px-[22px] text-[15px] text-ink">Invest: message us on WhatsApp</a>
          <span className="text-[15px] text-white/85">For investment enquiries and bank details, call or WhatsApp <a href={INVEST_TEL_URL} className="text-white underline">{INVEST_PHONE_DISPLAY}</a></span>
        </div>
      </PhotoHero>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-12 sm:px-6">
        <Calculator />

        <Card title="How investing with Valley Ride Capital works">
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3 p-0">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="flex flex-col gap-1.5 rounded-card bg-field px-5 py-4">
                <span className="text-sm text-muted">Step {i + 1}</span>
                <span className="text-xl">{t}</span>
                <span className="text-[15px] leading-normal text-body">{d}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="What your money funds">
          <P>
            Valley Ride rents scooters and motorcycles from one pickup point at Dorm Hub, Sahastradhara Road, Dehradun: Honda Activa 125, Royal Enfield
            Hunter 350, Scram 440 and Himalayan 450, Hero XPulse 210, Suzuki V-Strom SX 250, Triumph Scrambler 400 X and KTM 390 Adventure X. Riders take
            them to Mussoorie, Rishikesh, Chakrata and the Garhwal Himalaya. Investment funds more bikes for the fleet; interest is paid from rental income.
          </P>
        </Card>

        <FaqList faqs={faqs} title="Valley Ride Capital: common questions" />
        <RelatedLinks links={[SEO_LINKS.fleet, SEO_LINKS.bikes, SEO_LINKS.adventure, SEO_LINKS.pickup]} />
      </main>
      <SiteFooter />
    </div>
  );
}
