import { AccountNav } from '@/components/account/account-nav';
import { SiteHeader } from '@/components/layout/site-header';

/** /account is behind middleware.ts (login cookie); the API checks ownership on every call. */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20">
      <SiteHeader active="account" />
      <main className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-6 px-4 pt-6 sm:px-6">
        <AccountNav />
        <section className="flex min-w-0 flex-[999_1_640px] flex-col gap-4">{children}</section>
      </main>
    </div>
  );
}
