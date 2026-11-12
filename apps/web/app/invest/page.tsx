import type { Metadata } from 'next';
import { Calculator } from '@/components/investor/calculator';
import { PhotoHero } from '@/components/layout/photo-hero';
import { SiteFooter } from '@/components/layout/site-footer';
import { INVEST_PHONE_DISPLAY, INVEST_TEL_URL, investWhatsAppUrl } from '@/lib/legal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Valley Ride Capital',
  description: 'Fund Valley Ride\'s two-wheeler fleet in Dehradun: ₹1 lakh or ₹2.5 lakh plans at 20% a year, interest paid monthly, principal returned after an 18-month lock-in.',
  path: '/invest',
});

export default function InvestPage() {
  return (
    <div className="pb-0">
      <PhotoHero active="capital" photos={['weekend', 'touring']} position="58% center" minH={560}>
        <span className="text-base text-white/85">Valley Ride Capital</span>
        <h1 className="m-0 max-w-[760px] text-[clamp(40px,5.5vw,68px)] font-normal tracking-[-1.2px]">Invest in the journey</h1>
        <p className="m-0 max-w-[640px] text-[19px] leading-normal text-white/85">Fund the expansion of a professionally managed two-wheeler fleet serving travellers and adventure riders across Uttarakhand. Two plans, ₹1 lakh or ₹2.5 lakh, at 20% a year: interest every month and your principal back after 18 months.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <a href={investWhatsAppUrl()} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full bg-surface px-[22px] text-[15px] text-ink">Invest: message us on WhatsApp</a>
          <span className="text-[15px] text-white/85">For investment enquiries and bank details, call or WhatsApp <a href={INVEST_TEL_URL} className="text-white underline">{INVEST_PHONE_DISPLAY}</a></span>
        </div>
      </PhotoHero>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-12 sm:px-6"><Calculator /></main>
      <SiteFooter />
    </div>
  );
}
