import { SiteFooter } from '@/components/layout/site-footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (<>{children}<SiteFooter /></>);
}
