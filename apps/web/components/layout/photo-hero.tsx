import { SiteHeader } from './site-header';

/** Dark photo header with rounded bottom corners, used by Routes and Capital. */
export function PhotoHero({ photo = 'cover', position = 'center 45%', active, minH = 460, children }: {
  photo?: 'cover' | 'welcome'; position?: string; active?: 'routes' | 'capital'; minH?: number; children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-b-[48px] bg-hero text-surface" style={{ minHeight: minH }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/images/photo-${photo}.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.3)_50%,rgba(0,0,0,0.72)_100%)]" />
      <SiteHeader variant="dark" active={active} />
      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-3.5 px-4 pb-[72px] pt-16 sm:px-6">{children}</div>
    </section>
  );
}
