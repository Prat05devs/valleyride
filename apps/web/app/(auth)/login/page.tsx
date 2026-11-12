import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/account/login-form';
import { HERO_PHOTOS, photoSrc, photoSrcSet } from '@/lib/photos';

export const metadata: Metadata = { title: 'Log in', robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-wrap gap-6 bg-canvas p-4 sm:p-6">
      <section className="relative flex min-h-[420px] min-w-0 flex-[1_1_520px] flex-col justify-between overflow-hidden rounded-[40px] bg-hero p-9 text-surface lg:min-h-[560px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc(HERO_PHOTOS.city)} srcSet={photoSrcSet(HERO_PHOTOS.city)} sizes="(min-width: 1024px) 55vw, (orientation: portrait) 250vw, 100vw" fetchPriority="high"
          alt="A Honda Activa 125 and a Royal Enfield Hunter 350 parked on Mall Road, Mussoorie, on a rainy evening" className="absolute inset-0 h-full w-full object-cover object-[60%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.1)_45%,rgba(0,0,0,0.55)_100%)]" />
        <Link href="/" className="relative flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="" className="h-[60px] w-[60px] rounded-full object-cover" />
          <span className="text-[26px] font-medium">Valley <span className="text-orange">Ride</span></span>
        </Link>
        <div className="relative flex max-w-[480px] flex-col gap-2.5">
          <h1 className="m-0 text-5xl font-normal tracking-[-0.8px]">Ride the valley</h1>
          <p className="m-0 text-lg leading-normal text-white/85">Scooters, Royal Enfields, KTM, Triumph and more for Dehradun, Mussoorie and Rishikesh.</p>
        </div>
      </section>
      <section className="flex min-w-0 flex-[1_1_420px] flex-col justify-center rounded-[40px] bg-surface p-8 sm:p-12">
        <Suspense><LoginForm /></Suspense>
      </section>
    </div>
  );
}
