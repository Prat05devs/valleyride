'use client';

import Link from 'next/link';
import { createContext, useContext, type ReactNode } from 'react';
import { CyclePhotos, useSlideCycle } from './photo-cycle';
import { cn } from '@/lib/utils';

export interface HeroSlide {
  /** Base path without size and extension; files are <base>-1280.webp, -1920.webp and -2560.webp. */
  base: string;
  alt: string;
  /** Small kicker, e.g. "City rides". */
  kicker: string;
  /** The slide's own headline, e.g. "Doon after dark". */
  title: string;
  /** The bikes in the photo, e.g. "Activa 125 · Hunter 350". */
  bikes: string;
  href: string;
  /** CSS object-position, keeping the bikes in frame when a tall phone screen crops the sides. */
  position?: string;
}

const INTERVAL_MS = 4500;

const SlideContext = createContext<{ slide: HeroSlide; index: number } | null>(null);

/**
 * The home page hero: full-screen photos of the fleet grouped by kind of ride, cross-fading (timing in
 * useSlideCycle), with the page's heading and search form (children) on top, a small headline for each photo
 * (HeroSlideCaption) and dots to switch photos.
 */
export function HeroSlideshow({ slides, children }: { slides: HeroSlide[]; children: ReactNode }) {
  const cycle = useSlideCycle(slides.length, INTERVAL_MS);
  const { current, go } = cycle;

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-hero text-surface">
      {/* Phones: the photo fills the first screen and fades into the page colour behind the search form below it.
          Larger screens: the photo covers the whole section. */}
      <div className="absolute inset-x-0 top-0 h-[100svh] sm:inset-0 sm:h-auto">
        <CyclePhotos bases={slides.map((s) => s.base)} alts={slides.map((s) => s.alt)} positions={slides.map((s) => s.position)} cycle={cycle} />
        {/* Phones: dark behind the header and headline, clear over the bikes, then into the page colour. */}
        <div className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.35)_30%,rgba(0,0,0,0)_50%,rgba(0,0,0,0.15)_72%,rgba(23,24,26,0.9)_92%,#17181a_100%)] sm:hidden" />
        {/* Larger screens: dark at the top (header), on the left (headline) and at the bottom (search form). */}
        <div className="absolute inset-0 z-[2] hidden bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.1)_35%,rgba(0,0,0,0.25)_65%,rgba(0,0,0,0.75)_100%)] sm:block" />
        <div className="absolute inset-0 z-[2] hidden bg-[linear-gradient(90deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0)_75%)] sm:block" />
      </div>

      <SlideContext.Provider value={{ slide: slides[current]!, index: current }}>{children}</SlideContext.Provider>

      {slides.length > 1 && (
        <div role="group" aria-label="Hero photos" className="absolute left-1/2 top-[calc(100svh-44px)] z-20 flex -translate-x-1/2 items-center gap-1 sm:bottom-3 sm:top-auto">
          {slides.map((s, i) => (
            <button key={s.base} type="button" aria-label={`Show photo ${i + 1}: ${s.kicker}`} aria-pressed={i === current} onClick={() => go(i)}
              className="flex h-7 w-7 items-center justify-center">
              <span className={cn('block h-1.5 rounded-full bg-white transition-all duration-300', i === current ? 'w-7 opacity-100' : 'w-1.5 opacity-50')} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/** The current photo's small headline; place it anywhere inside HeroSlideshow. */
export function HeroSlideCaption({ className }: { className?: string }) {
  const ctx = useContext(SlideContext);
  if (!ctx) return null;
  const { slide, index } = ctx;
  return (
    <Link key={index} href={slide.href} aria-live="polite"
      className={cn('group flex w-full max-w-[360px] animate-[hero-caption_700ms_ease-out] flex-col gap-0.5 rounded-[20px] bg-black/30 px-4 py-3 text-white backdrop-blur-md motion-reduce:animate-none sm:gap-1 sm:rounded-[24px] sm:px-5 sm:py-4', className)}>
      <span className="text-xs uppercase tracking-[2px] text-orange">{slide.kicker}</span>
      <span className="text-xl font-medium leading-tight tracking-[-0.3px] sm:text-2xl">{slide.title}</span>
      <span className="text-sm text-white/80">{slide.bikes}</span>
      <span className="mt-1 hidden text-sm text-white/90 underline decoration-white/40 underline-offset-4 group-hover:decoration-white sm:inline">See these bikes</span>
    </Link>
  );
}
