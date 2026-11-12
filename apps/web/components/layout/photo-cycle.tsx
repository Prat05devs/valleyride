'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { PHOTO_SIZES, photoSrc, photoSrcSet } from '@/lib/photos';
import { cn } from '@/lib/utils';

/**
 * Timing for a cross-fading photo background. Each photo shows for `intervalMs`; the next one is requested right
 * away and the switch waits until it has downloaded, so a fade never reveals an empty frame. The previous photo
 * stays underneath while the new one fades in. It does not advance for visitors who ask for reduced motion, and
 * waits while the tab is hidden. `go(i)` jumps to a photo and stops the automatic change.
 */
export function useSlideCycle(count: number, intervalMs = 4500) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [mounted, setMounted] = useState(1); // how many photos have been put in the page so far
  const [loaded, setLoaded] = useState<number[]>([]);
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0); // re-runs the timer when the next photo was not ready yet

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setAuto(false);
  }, []);

  useEffect(() => {
    if (!auto || count < 2) return;
    const nextIndex = (current + 1) % count;
    const preload = window.setTimeout(() => setMounted((m) => Math.max(m, Math.min(current + 2, count))), 400);
    const next = window.setTimeout(() => {
      if (document.hidden || !loaded.includes(nextIndex)) { setTick((t) => t + 1); return; }
      setPrev(current); setCurrent(nextIndex);
    }, tick === 0 ? intervalMs : 300);
    return () => { window.clearTimeout(preload); window.clearTimeout(next); };
  }, [auto, count, current, intervalMs, loaded, tick]);

  useEffect(() => { setTick(0); }, [current]);

  const markLoaded = (i: number) => setLoaded((l) => (l.includes(i) ? l : [...l, i]));
  const go = (i: number) => {
    if (i === current) return;
    setMounted((m) => Math.max(m, i + 1)); setPrev(current); setCurrent(i); setAuto(false);
  };
  return { current, prev, mounted, markLoaded, go };
}

type Cycle = ReturnType<typeof useSlideCycle>;

/** The stacked <img> layers for a cycle. `positions` apply below the sm breakpoint (phones); larger screens centre. */
export function CyclePhotos({ bases, alts, positions, cycle }: { bases: string[]; alts: string[]; positions?: (string | undefined)[]; cycle: Cycle }) {
  const { current, prev, mounted, markLoaded } = cycle;
  return (
    <>
      {bases.slice(0, mounted).map((base, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={base} alt={i === current ? alts[i] ?? '' : ''} aria-hidden={i !== current}
          src={photoSrc(base)} srcSet={photoSrcSet(base)} sizes={PHOTO_SIZES}
          fetchPriority={i === 0 ? 'high' : 'low'} decoding="async"
          onLoad={() => markLoaded(i)}
          // The first photo is in the server HTML and may finish before React attaches onLoad.
          ref={(el) => { if (el?.complete && el.naturalWidth > 0) markLoaded(i); }}
          style={{ '--pos-m': positions?.[i] ?? 'center' } as CSSProperties}
          className={cn('absolute inset-0 h-full w-full object-cover [object-position:var(--pos-m)] sm:[object-position:center]',
            'transition-[opacity,transform] duration-[1000ms] ease-in-out motion-reduce:transition-none',
            i === current ? 'z-[1] scale-100 opacity-100' : i === prev ? 'z-0 scale-100 opacity-100' : 'z-0 scale-[1.04] opacity-0')} />
      ))}
    </>
  );
}

/** A self-running cross-fade of photos with no controls, for page headers (PhotoHero). */
export function PhotoCycle({ bases, alts, positions }: { bases: string[]; alts: string[]; positions?: (string | undefined)[] }) {
  const cycle = useSlideCycle(bases.length, 5000);
  return <CyclePhotos bases={bases} alts={alts} positions={positions} cycle={cycle} />;
}
