'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useMe } from '@/lib/use-me';

type Active = 'none' | 'fleet' | 'routes' | 'capital' | 'account';

const LINKS: { id: Active; label: string; href: string }[] = [
  { id: 'fleet', label: 'Fleet', href: '/fleet' },
  { id: 'routes', label: 'Routes', href: '/routes' },
  { id: 'capital', label: 'Valley Ride Capital', href: '/invest' },
  { id: 'account', label: 'My bookings', href: '/account/bookings' },
];

/**
 * Logo, glass pill nav and the booking CTA, fixed to the top of the window. `dark` sits over a photo hero until the
 * page scrolls; then the bar turns solid white so it stays readable over any content. A spacer of the same height
 * keeps the page layout where it was.
 */
export function SiteHeader({ active = 'none', variant = 'light' }: { active?: Active; variant?: 'light' | 'dark' }) {
  const { data: me } = useMe();
  const staff = me && (me.role === 'staff' || me.role === 'admin');
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The spacer follows the bar's height at rest (it wraps to two rows on phones); measured once unscrolled.
    const measure = () => { if (window.scrollY <= 8) setHeight(el.offsetHeight); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const dark = variant === 'dark' && !scrolled;
  return (
    <>
    <div aria-hidden="true" className={cn('w-full', height === undefined && 'h-[146px] sm:h-[88px]')} style={height === undefined ? undefined : { height }} />
    <header ref={ref} className={cn('fixed inset-x-0 top-0 z-50 w-full px-4 transition-[background-color,box-shadow,padding] duration-200 sm:px-6',
      scrolled ? 'bg-surface py-3 text-ink shadow-[0_1px_0_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)]' : 'py-5',
      dark ? 'text-surface' : 'text-ink')}>
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="" className="h-12 w-12 rounded-full object-cover" />
          <span className="text-2xl font-medium tracking-[-0.3px] max-[359px]:sr-only">Valley <span className="text-orange">Ride</span></span>
        </Link>
        {/* On phones the menu is a second row; it folds away while scrolled so the bar stays one row high. */}
        <nav aria-label="Main" className={cn('order-3 flex w-full gap-1 overflow-x-auto rounded-full p-[5px] sm:order-none sm:w-auto', dark ? 'glass' : scrolled ? 'bg-field' : 'bg-surface', scrolled && 'max-sm:hidden')}>
          {LINKS.map((l) => {
            const on = l.id === active;
            return (
              <Link key={l.id} href={l.href} aria-current={on ? 'page' : undefined}
                className={cn('inline-flex h-[42px] shrink-0 items-center rounded-full px-[18px] text-[15px]',
                  on ? (dark ? 'bg-surface text-ink' : 'bg-ink text-surface') : 'hover:opacity-70')}>
                {l.label}
              </Link>
            );
          })}
          <Link href={me ? '/account/bookings' : '/login'} className="inline-flex h-[42px] shrink-0 items-center rounded-full px-[18px] text-[15px] hover:opacity-70 sm:hidden">
            {me ? me.fullName?.split(' ')[0] || 'Account' : 'Log in'}
          </Link>
        </nav>
        <div className="flex items-center gap-2.5">
          {staff && <Link href="/admin" className="inline-flex h-[46px] items-center px-3 text-[15px] hover:opacity-70 max-sm:hidden">Admin</Link>}
          {me ? <Link href="/account/bookings" className="inline-flex h-[46px] items-center px-3 text-[15px] hover:opacity-70 max-sm:hidden">{me.fullName?.split(' ')[0] || 'Account'}</Link>
            : <Link href="/login" className="inline-flex h-[46px] items-center px-[18px] text-[15px] hover:opacity-70 max-sm:hidden">Log in</Link>}
          <Link href="/book" className={cn('inline-flex h-[46px] items-center rounded-full px-[22px] text-[15px]', dark ? 'bg-surface text-ink' : 'bg-ink text-surface')}>Book a ride</Link>
        </div>
      </div>
    </header>
    </>
  );
}
