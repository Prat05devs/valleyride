import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { Breadcrumbs, FaqList, PickupCard, RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { breadcrumbJsonLd, faqJsonLd, getModelsSafe, JsonLd, pageMetadata } from '@/lib/seo';
import { generalFaqs } from '@/lib/seo-content';

export const revalidate = 300;

const PATH = '/faq';

export const metadata = pageMetadata({
  title: 'Bike Rental in Dehradun: FAQ on Prices, Documents and Deposit | Valley Ride',
  absoluteTitle: true,
  description: 'Answers about renting a bike or scooty in Dehradun with Valley Ride: daily prices, documents and licence, security deposit, km limits, Mussoorie and Rishikesh rides, cancellation and the Dorm Hub pickup point.',
  path: PATH,
  keywords: ['bike rental Dehradun FAQ', 'documents required for bike rent Dehradun', 'bike rent Dehradun price', 'security deposit bike rental Dehradun', 'scooty to Mussoorie', 'Dehradun to Mussoorie by bike time'],
});

export default async function FaqPage() {
  const faqs = generalFaqs(await getModelsSafe());
  return (
    <div className="pb-6">
      <JsonLd data={[breadcrumbJsonLd([{ name: 'FAQ', path: PATH }]), faqJsonLd(faqs)]} />
      <SiteHeader />
      <main className="mx-auto flex max-w-[960px] flex-col gap-5 px-4 pt-8 sm:px-6">
        <Breadcrumbs items={[{ name: 'FAQ' }]} />
        <h1 className="m-0 text-[clamp(36px,5vw,56px)] font-normal tracking-[-1px]">Bike rental in Dehradun: your questions answered</h1>
        <p className="m-0 text-[19px] leading-normal text-body">
          Everything about renting a scooter or Royal Enfield from Valley Ride in Dehradun. Can&apos;t find your answer? See the{' '}
          <Link href="/terms" className="underline">rental terms</Link> or read the essentials <Link href="/hi/bike-rental-dehradun" className="underline" hrefLang="hi">in Hindi (हिंदी में)</Link>.
        </p>
        <FaqList faqs={faqs} title="Renting a bike with Valley Ride" />
        <PickupCard />
        <RelatedLinks links={[SEO_LINKS.bikes, SEO_LINKS.scooty, SEO_LINKS.enfield, SEO_LINKS.adventure, SEO_LINKS.places, SEO_LINKS.pickup, SEO_LINKS.hindi]} />
      </main>
    </div>
  );
}
