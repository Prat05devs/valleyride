import { SiteHeader } from '@/components/layout/site-header';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (<div className="pb-20"><SiteHeader active="capital" /><main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-6 sm:px-6">{children}</main></div>);
}
