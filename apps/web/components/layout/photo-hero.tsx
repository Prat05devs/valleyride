import { HERO_PHOTOS, PHOTO_SIZES, photoSrc, photoSrcSet, type HeroPhoto } from '@/lib/photos';
import { PhotoCycle } from './photo-cycle';
import { SiteHeader } from './site-header';

type Photo = 'cover' | 'welcome' | HeroPhoto;

/**
 * Dark photo header with rounded bottom corners (Routes, Capital and the landing pages). `photo` is one picture;
 * `photos` cross-fades several. `position` frames the photo on phones (larger screens centre it).
 */
export function PhotoHero({ photo = 'cover', photos, position = 'center 45%', active, minH = 460, children }: {
  photo?: Photo; photos?: HeroPhoto[]; position?: string; active?: 'routes' | 'capital'; minH?: number; children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-b-[48px] bg-hero text-surface" style={{ minHeight: minH }}>
      {photos && photos.length > 1 ? (
        <PhotoCycle bases={photos.map((p) => HERO_PHOTOS[p])} alts={photos.map(() => '')} positions={photos.map(() => position)} />
      ) : (
        <Img photo={photos?.[0] ?? photo} position={position} />
      )}
      <div className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.3)_50%,rgba(0,0,0,0.72)_100%)]" />
      <SiteHeader variant="dark" active={active} />
      <div className="relative z-[3] mx-auto flex max-w-[1280px] flex-col gap-3.5 px-4 pb-[72px] pt-16 sm:px-6">{children}</div>
    </section>
  );
}

function Img({ photo, position }: { photo: Photo; position: string }) {
  if (photo === 'cover' || photo === 'welcome') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/images/photo-${photo}.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />;
  }
  const base = HERO_PHOTOS[photo];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photoSrc(base)} srcSet={photoSrcSet(base)} sizes={PHOTO_SIZES} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />;
}
