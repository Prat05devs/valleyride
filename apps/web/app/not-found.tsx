import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';

export default function NotFound() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-[720px] px-4 py-20 text-center">
        <h1 className="m-0 text-5xl font-normal tracking-[-0.8px]">Page not found</h1>
        <p className="mt-2 text-lg text-muted">That road doesn&apos;t go anywhere.</p>
        <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-surface">Back to home</Link>
      </main>
    </div>
  );
}
