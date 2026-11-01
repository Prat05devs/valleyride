import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { PHONE_DISPLAY, POLICIES_UPDATED, POLICY_LINKS, SUPPORT_EMAIL, WHATSAPP_URL } from '@/lib/legal';

/** One policy page: title, date, intro, card sections, then the contact line and links to the other policies. */
export function LegalPage({ title, intro, path, children }: { title: string; intro?: ReactNode; path: string; children: ReactNode }) {
  return (
    <div className="pb-10">
      <SiteHeader />
      <main className="mx-auto flex max-w-[860px] flex-col gap-4 px-4 pt-10 sm:px-6">
        <h1 className="m-0 text-[40px] font-normal leading-[1.1] tracking-[-0.8px] sm:text-5xl">{title}</h1>
        <p className="m-0 text-[15px] text-muted">Last updated {POLICIES_UPDATED}</p>
        {intro && <div className="text-[17px] leading-[1.6] text-body [&_p]:m-0">{intro}</div>}
        {children}
        <section className="flex flex-col gap-2 rounded-card bg-surface p-7">
          <h2 className="m-0 text-2xl font-normal">Questions</h2>
          <p className="m-0 text-[17px] leading-[1.6] text-body">
            Call or <a href={WHATSAPP_URL} className="text-ink underline">WhatsApp {PHONE_DISPLAY}</a>
            {SUPPORT_EMAIL && <>, or email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ink underline">{SUPPORT_EMAIL}</a></>}.
            {' '}More ways to reach us are on the <Link href="/contact" className="text-ink underline">contact page</Link>.
          </p>
        </section>
        <nav aria-label="Policies" className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 text-sm">
          {POLICY_LINKS.filter((l) => l.href !== path).map((l) => <Link key={l.href} href={l.href} className="text-muted hover:text-ink">{l.label}</Link>)}
        </nav>
      </main>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-card bg-surface p-7 text-[17px] leading-[1.6] text-body [&_p]:m-0 [&_a]:text-ink [&_a]:underline [&_strong]:font-medium [&_strong]:text-ink">
      <h2 className="m-0 text-2xl font-normal text-ink">{title}</h2>
      {children}
    </section>
  );
}

export const List = ({ items }: { items: ReactNode[] }) => (
  <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
);
