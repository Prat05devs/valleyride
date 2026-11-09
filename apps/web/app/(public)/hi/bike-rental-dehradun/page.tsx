import Link from 'next/link';
import { DURATION_TIERS, GST_PCT } from '@valleyride/shared';
import { PhotoHero } from '@/components/layout/photo-hero';
import { Breadcrumbs, FaqList, RelatedLinks, SEO_LINKS } from '@/components/seo/blocks';
import { bikePhoto } from '@/lib/bikes';
import { formatPaise } from '@/lib/format';
import { BUSINESS, breadcrumbJsonLd, faqJsonLd, getModelsSafe, JsonLd, pageMetadata } from '@/lib/seo';
import { hindiFaqs } from '@/lib/seo-content';

export const revalidate = 300;

const PATH = '/hi/bike-rental-dehradun';

export const metadata = pageMetadata({
  title: 'देहरादून में बाइक और स्कूटी किराये पर | रॉयल एनफील्ड, एक्टिवा | Valley Ride',
  absoluteTitle: true,
  description: 'देहरादून में बाइक और स्कूटी किराये पर लें: होंडा एक्टिवा 125, रॉयल एनफील्ड हंटर 350, स्क्रैम 440 और हिमालयन 450। पिकअप Dorm Hub, सहस्रधारा रोड से। किराये में GST शामिल, डिपॉज़िट वापस।',
  path: PATH,
  locale: 'hi_IN',
  keywords: ['देहरादून में बाइक किराये पर', 'देहरादून स्कूटी किराये पर', 'रॉयल एनफील्ड किराये पर देहरादून', 'dehradun me bike rent', 'dehradun me scooty kiraye par', 'mussoorie ke liye bike rent', 'bike kiraye par dehradun'],
  languages: { 'en-IN': '/bike-rental-dehradun', 'hi-IN': PATH },
});

const BIKES = [
  { slug: 'activa-125', name: 'होंडा एक्टिवा 125', use: 'शहर, सहस्रधारा, रॉबर्स केव और ऋषिकेश के लिए। बिना गियर, हल्की और पार्क करने में आसान।' },
  { slug: 'hunter-350', name: 'रॉयल एनफील्ड हंटर 350', use: 'मसूरी, लंढौर और धनौल्टी के लिए, अकेले या पीछे सवारी के साथ।' },
  { slug: 'scram-440', name: 'रॉयल एनफील्ड स्क्रैम 440', use: 'मिली-जुली और टूटी सड़कों के लिए: मसूरी, केम्प्टी फॉल और मालदेवता।' },
  { slug: 'himalayan-450', name: 'रॉयल एनफील्ड हिमालयन 450', use: 'लंबी पहाड़ी यात्राओं के लिए: चकराता, टिहरी और चोपता।' },
];

const RIDES = [
  ['सहस्रधारा', 'Dorm Hub से लगभग 6 किमी', '/places-to-visit-near-dehradun#sahastradhara'],
  ['मसूरी और लंढौर', '33–35 किमी, 1.5–2 घंटे', '/routes/dehradun-mussoorie'],
  ['ऋषिकेश', 'लगभग 45 किमी, 1.25–1.5 घंटे', '/routes/dehradun-rishikesh'],
  ['केम्प्टी फॉल', 'मसूरी होकर लगभग 48 किमी', '/places-to-visit-near-dehradun#kempty-falls'],
  ['धनौल्टी और सुरकंडा देवी', 'मसूरी होकर लगभग 60 किमी', '/places-to-visit-near-dehradun#dhanaulti'],
  ['चकराता और टाइगर फॉल', 'कालसी होकर लगभग 90 किमी', '/places-to-visit-near-dehradun#chakrata'],
] as const;

const discounts = [...DURATION_TIERS].reverse().map((t) => `${t.minDays} दिन से ${t.pct}%`).join(', ');

export default async function HindiBikeRentalPage() {
  const models = await getModelsSafe();
  const faqs = hindiFaqs(models);
  const p = BUSINESS.pickup;
  return (
    <div className="pb-6">
      <JsonLd data={[breadcrumbJsonLd([{ name: 'देहरादून में बाइक किराये पर', path: PATH }]), faqJsonLd(faqs, 'hi-IN')]} />
      <PhotoHero position="center 55%" minH={500}>
        <div lang="hi" className="flex flex-col gap-3.5">
          <Breadcrumbs dark items={[{ name: 'देहरादून में बाइक किराये पर' }]} />
          <h1 className="m-0 max-w-[860px] text-[clamp(38px,5.2vw,64px)] font-normal tracking-[-0.6px]">देहरादून में बाइक और स्कूटी किराये पर</h1>
          <p className="m-0 max-w-[700px] text-[19px] leading-normal text-white/85">
            होंडा एक्टिवा 125 स्कूटी या रॉयल एनफील्ड हंटर 350, स्क्रैम 440 और हिमालयन 450: दिन, हफ़्ते या महीने भर के लिए। सहस्रधारा रोड पर Dorm Hub से बाइक लें,
            मसूरी, ऋषिकेश या धनौल्टी घूमें, और लौटाने पर डिपॉज़िट वापस पाएँ।
          </p>
          <div className="mt-2 flex flex-wrap gap-2.5">
            <Link href="/book" className="inline-flex h-12 items-center rounded-full bg-surface px-[22px] text-[15px] text-ink">बाइक बुक करें</Link>
            <Link href="/bike-rental-dehradun" hrefLang="en" className="glass inline-flex h-12 items-center rounded-full px-[22px] text-[15px]">Read in English</Link>
          </div>
        </div>
      </PhotoHero>

      <main lang="hi" className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-12 sm:px-6">
        <section className="flex flex-col gap-5">
          <h2 className="m-0 text-[34px] font-normal">किराये के लिए बाइक और स्कूटी</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
            {BIKES.map((b) => {
              const m = models.find((x) => x.slug === b.slug);
              return (
                <Link key={b.slug} href={`/fleet/${b.slug}`} className="flex flex-col gap-2.5 rounded-sheet bg-surface px-5 pb-5 pt-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bikePhoto(b.slug)} alt={`${b.name} देहरादून में किराये पर`} loading="lazy" className="h-[160px] w-full object-contain" />
                  <span className="text-xl">{b.name}</span>
                  {m && <span className="text-[15px] text-muted">{formatPaise(m.pricePerDayPaise)} प्रति दिन · {m.kmPerDay} किमी प्रति दिन शामिल · {formatPaise(m.depositPaise)} डिपॉज़िट</span>}
                  <span className="text-[15px] leading-normal text-body">{b.use}</span>
                </Link>
              );
            })}
          </div>
          <p className="m-0 text-[15px] text-muted">किराये में {GST_PCT}% GST शामिल है। लंबी बुकिंग पर छूट: {discounts}।</p>
        </section>

        <section className="flex flex-col gap-4 rounded-[36px] bg-dark p-7 text-surface sm:p-8">
          <h2 className="m-0 text-[28px] font-normal">पिकअप और वापसी: Dorm Hub, देहरादून</h2>
          <address className="not-italic text-[17px] leading-[1.6] text-white/85">Dorm Hub, चौथी मंज़िल, सहस्रधारा रोड, दून आईटी पार्क के पास, अमन विहार, देहरादून, उत्तराखंड {p.postalCode}</address>
          <p className="m-0 text-[17px] text-white/85">हर दिन सुबह 8 बजे से रात 8 बजे तक। पिकअप और वापसी एक ही जगह।</p>
          <a href={p.mapUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center self-start rounded-full bg-surface px-[22px] text-[15px] text-ink">Google Maps में खोलें</a>
        </section>

        <section className="flex flex-col gap-3 rounded-[36px] bg-surface p-7 sm:p-8">
          <h2 className="m-0 text-[28px] font-normal">बाइक कैसे बुक करें</h2>
          <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-[17px] leading-[1.6] text-body">
            <li>valleyride.in या Valley Ride ऐप पर तारीख, समय और बाइक चुनें।</li>
            <li>किराया और वापसी योग्य डिपॉज़िट UPI या कार्ड से भरें। भुगतान के दौरान बाइक 15 मिनट के लिए आपके नाम रुकी रहती है।</li>
            <li>अपने अकाउंट में ड्राइविंग लाइसेंस और पहचान पत्र अपलोड करें।</li>
            <li>असली दस्तावेज़ लेकर Dorm Hub, सहस्रधारा रोड से बाइक लें।</li>
            <li>बाइक वहीं लौटाएँ। जाँच के बाद डिपॉज़िट उसी UPI या कार्ड में वापस आ जाता है।</li>
          </ol>
        </section>

        <section className="flex flex-col gap-3 rounded-[36px] bg-surface p-7 sm:p-8">
          <h2 className="m-0 text-[28px] font-normal">देहरादून से बाइक पर कहाँ घूमें</h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3 p-0">
            {RIDES.map(([name, line, href]) => (
              <li key={name}><Link href={href} className="flex flex-col gap-0.5 rounded-card bg-field px-5 py-4"><span className="text-lg">{name}</span><span className="text-[15px] text-muted">{line}</span></Link></li>
            ))}
          </ul>
        </section>

        <FaqList faqs={faqs} title="अक्सर पूछे जाने वाले सवाल" lang="hi" />
        <div lang="en"><RelatedLinks links={[SEO_LINKS.bikes, SEO_LINKS.scooty, SEO_LINKS.enfield, SEO_LINKS.places, SEO_LINKS.faq]} /></div>
      </main>
    </div>
  );
}
