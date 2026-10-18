import type { Metadata } from 'next';
import { Calculator } from '@/components/investor/calculator';
import { PhotoHero } from '@/components/layout/photo-hero';
import { SiteFooter } from '@/components/layout/site-footer';

export const metadata: Metadata = {
  title: 'Valley Ride Capital',
  description: 'Fund the expansion of a professionally managed two-wheeler fleet in Uttarakhand. Illustrative calculator; not open for investment yet.',
};

export default function InvestPage() {
  return (
    <div className="pb-0">
      <PhotoHero active="capital" position="center 55%" minH={520}>
        <span className="text-base text-white/85">Valley Ride Capital</span>
        <h1 className="m-0 max-w-[760px] text-[clamp(40px,5.5vw,68px)] font-normal tracking-[-1.2px]">Invest in the journey</h1>
        <p className="m-0 max-w-[640px] text-[19px] leading-normal text-white/85">Fund the expansion of a professionally managed two-wheeler fleet serving travellers and adventure riders across Uttarakhand. The figures below are illustrations only.</p>
        <div role="note" className="glass mt-2 flex items-center gap-2.5 self-start rounded-full px-[18px] py-3 text-[15px]"><span className="h-2 w-2 shrink-0 rounded-full bg-orange" />We are not accepting investments yet. This page opens for investment only after legal and tax review.</div>
      </PhotoHero>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-12 sm:px-6"><Calculator /></main>
      <SiteFooter />
    </div>
  );
}
