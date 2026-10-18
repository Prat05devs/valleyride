import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: { default: 'Admin', template: '%s · Valley Ride admin' }, robots: { index: false } };

/** Role guard: staff and admins only. The API enforces the same rule with authorize() on every admin route. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'staff' && user.role !== 'admin') redirect('/');
  return (
    <div className="flex min-h-screen flex-wrap items-start gap-5 bg-canvas p-4 sm:p-5">
      <div className="min-w-0 flex-[1_1_240px] lg:sticky lg:top-5 lg:max-w-[264px]"><AdminSidebar /></div>
      <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-4">{children}</main>
    </div>
  );
}
