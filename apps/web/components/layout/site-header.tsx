'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/brand/icon';
import { DESK_HOURS, INSTAGRAM_HANDLE, INSTAGRAM_URL, PHONE_DISPLAY, TEL_URL, WHATSAPP_URL } from '@/lib/legal';
import { cn } from '@/lib/utils';
import { useMe } from '@/lib/use-me';

type Active = 'none' | 'fleet' | 'routes' | 'capital' | 'account';

const LINKS: { id: Active; label: string; href: string; icon: IconName; hint: string }[] = [
  { id: 'fleet', label: 'Fleet', href: '/fleet', icon: 'gauge', hint: 'Scooty to KTM: prices and specs' },
  { id: 'routes', label: 'Routes', href: '/routes', icon: 'route', hint: 'Ride guides from Dehradun' },
  { id: 'capital', label: 'Valley Ride Capital', href: '/invest', icon: 'wallet', hint: 'Invest in the fleet' },
  { id: 'account', label: 'My bookings', href: '/account/bookings', icon: 'ticket', hint: 'Trips, payments and documents' },
];

/**
 * Fixed site header. Desktop (lg+): logo, glass pill nav, account and the booking CTA. Phones and tablets: one slim
 * row with the logo, the booking CTA (kept visible, as the main action) and a Menu button that opens a full-screen
 * menu (MobileMenu). `dark` sits over a photo hero until the page scrolls; then the bar turns solid white so it stays
 * readable over any content. A spacer of the same height keeps the page layout where it was.
 */
export function SiteHeader({ active = 'none', variant = 'light' }: { active?: Active; variant?: 'light' | 'dark' }) {
  const { data: me } = useMe();
  const staff = !!me && (me.role === 'staff' || me.role === 'admin');
  const ref = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The spacer follows the bar's height at rest (measured unscrolled, as the bar tightens while scrolled).
    const measure = () => { if (window.scrollY <= 8) setHeight(el.offsetHeight); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const closeMenu = useCallback(() => { setMenuOpen(false); menuButton.current?.focus(); }, []);
  const dark = variant === 'dark' && !scrolled;
  const firstName = me?.fullName?.split(' ')[0] || 'Account';

  return (
    <>
    <div aria-hidden="true" className={cn('w-full', height === undefined && 'h-[68px] lg:h-[88px]')} style={height === undefined ? undefined : { height }} />
    <header ref={ref} className={cn('fixed inset-x-0 top-0 z-50 w-full px-4 transition-[background-color,box-shadow,padding] duration-200 sm:px-6',
      scrolled ? 'bg-surface py-2.5 text-ink shadow-[0_1px_0_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] lg:py-3' : 'py-3 lg:py-5',
      dark ? 'text-surface' : 'text-ink')}>
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 lg:gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 lg:gap-3" aria-label="Valley Ride home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="" className="h-10 w-10 shrink-0 rounded-full object-cover lg:h-12 lg:w-12" />
          <span className="truncate text-xl font-medium tracking-[-0.3px] max-[359px]:sr-only lg:text-2xl">Valley <span className="text-orange">Ride</span></span>
        </Link>

        <nav aria-label="Main" className={cn('hidden gap-1 rounded-full p-[5px] lg:flex', dark ? 'glass' : scrolled ? 'bg-field' : 'bg-surface')}>
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
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:gap-2.5">
          {staff && <Link href="/admin" className="hidden h-[46px] items-center px-3 text-[15px] hover:opacity-70 lg:inline-flex">Admin</Link>}
          {me ? <Link href="/account/bookings" className="hidden h-[46px] items-center px-3 text-[15px] hover:opacity-70 lg:inline-flex">{firstName}</Link>
            : <Link href="/login" className="hidden h-[46px] items-center px-[18px] text-[15px] hover:opacity-70 lg:inline-flex">Log in</Link>}
          <Link href="/book" className={cn('inline-flex h-11 items-center rounded-full px-[18px] text-[15px] lg:h-[46px] lg:px-[22px]', dark ? 'bg-surface text-ink' : 'bg-ink text-surface')}>
            Book<span className="max-[379px]:hidden">&nbsp;a ride</span>
          </Link>
          <button ref={menuButton} type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="site-menu" aria-label="Open menu"
            className={cn('inline-flex h-11 w-11 items-center justify-center rounded-full lg:hidden', dark ? 'glass' : 'bg-field')}>
            <Icon name="menu" size={22} />
          </button>
        </div>
      </div>
    </header>
    {menuOpen && <MobileMenu active={active} me={me ? { firstName, staff } : null} onClose={closeMenu} />}
    </>
  );
}

/**
 * Full-screen menu for phones and tablets (a modal dialog: focus moves in and stays inside, Escape or the close
 * button closes it and focus returns to the Menu button, the page behind does not scroll). It closes on navigation
 * and when the window grows to the desktop layout.
 */
function MobileMenu({ active, me, onClose }: { active: Active; me: { firstName: string; staff: boolean } | null; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const opened = useRef(pathname);

  useEffect(() => { if (pathname !== opened.current) onClose(); }, [pathname, onClose]);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    el.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
      const first = items[0], last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onWide = () => { if (desktop.matches) onClose(); };
    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onWide);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); desktop.removeEventListener('change', onWide); };
  }, [onClose]);

  return (
    <div ref={panel} id="site-menu" role="dialog" aria-modal="true" aria-label="Menu"
      className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-surface text-ink animate-[menu-in_220ms_ease-out] motion-reduce:animate-none lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5" aria-label="Valley Ride home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="" className="h-10 w-10 rounded-full object-cover" />
          <span className="text-xl font-medium tracking-[-0.3px]">Valley <span className="text-orange">Ride</span></span>
        </Link>
        <button type="button" onClick={onClose} aria-label="Close menu" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-field">
          <Icon name="x" size={22} />
        </button>
      </div>

      <nav aria-label="Main" className="mx-auto flex w-full max-w-[640px] flex-col gap-1.5 px-4 pt-4 sm:px-6">
        {LINKS.map((l) => {
          const on = l.id === active;
          return (
            <Link key={l.id} href={l.href} onClick={onClose} aria-current={on ? 'page' : undefined}
              className={cn('flex min-h-[68px] items-center gap-4 rounded-[22px] px-4 transition-colors', on ? 'bg-ink text-surface' : 'bg-field active:bg-line')}>
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', on ? 'bg-white/15' : 'bg-surface')}><Icon name={l.icon} size={20} /></span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[19px] leading-tight">{l.label}</span>
                <span className={cn('truncate text-sm', on ? 'text-white/70' : 'text-muted')}>{l.hint}</span>
              </span>
              <Icon name="chevronRight" size={18} className={on ? 'text-white/70' : 'text-muted'} />
            </Link>
          );
        })}
      </nav>

      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-2 px-4 pt-5 sm:px-6">
        {me ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/account/bookings" onClick={onClose} className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-5 text-[15px]"><Icon name="user" size={18} />{me.firstName}</Link>
            {me.staff && <Link href="/admin" onClick={onClose} className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-5 text-[15px]"><Icon name="sliders" size={18} />Admin console</Link>}
          </div>
        ) : (
          <Link href="/login" onClick={onClose} className="inline-flex h-12 items-center gap-2 self-start rounded-full border border-line px-5 text-[15px]"><Icon name="user" size={18} />Log in or create an account</Link>
        )}
      </div>

      <div className="mx-auto mt-auto flex w-full max-w-[640px] flex-col gap-3 px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-8 sm:px-6">
        <Link href="/book" onClick={onClose} className="flex h-14 items-center justify-center rounded-full bg-ink text-[17px] text-surface">Book a ride</Link>
        <div className="grid grid-cols-2 gap-2">
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full bg-field text-[15px]"><Icon name="chat" size={18} />WhatsApp</a>
          <a href={TEL_URL} className="flex h-12 items-center justify-center gap-2 rounded-full bg-field text-[15px]"><Icon name="phone" size={18} />Call us</a>
        </div>
        <p className="m-0 text-center text-sm text-muted">Bookings and help: {PHONE_DISPLAY} · {DESK_HOURS}</p>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer me" className="self-center text-sm underline">Follow us on Instagram {INSTAGRAM_HANDLE}</a>
      </div>
    </div>
  );
}
