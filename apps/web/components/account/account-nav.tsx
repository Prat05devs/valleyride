'use client';

import type { CustomerDocumentDTO } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useMe } from '@/lib/use-me';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/account/bookings', label: 'My bookings' },
  { href: '/account/documents', label: 'Documents', dot: true },
  { href: '/account/payments', label: 'Payments and refunds' },
  { href: '/account/profile', label: 'Profile' },
];

export function AccountNav() {
  const path = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const docs = useQuery({ queryKey: ['kyc'], queryFn: () => api.get<CustomerDocumentDTO[]>('/kyc/documents') });
  const needsDocs = docs.data && !(docs.data.some((d) => d.type === 'DL' && d.status !== 'REJECTED') && docs.data.some((d) => d.type !== 'DL' && d.status !== 'REJECTED'));

  async function logout() {
    await api.post('/auth/logout').catch(() => {});
    qc.clear();
    router.replace('/login');
    router.refresh();
  }

  return (
    <nav aria-label="Account" className="flex min-w-0 flex-[1_1_240px] flex-col gap-1 rounded-sheet bg-surface p-5">
      <div className="flex items-center gap-3 px-1.5 pb-4 pt-1">
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-ink text-xl font-medium text-surface">{(me?.fullName ?? me?.phone ?? '?').trim()[0]?.toUpperCase()}</span>
        <span><span className="block text-[17px]">{me?.fullName ?? 'Add your name'}</span><span className="text-sm text-muted">{me?.phone.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2')}</span></span>
      </div>
      {LINKS.map((l) => {
        const on = path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={on ? 'page' : undefined}
            className={cn('flex h-12 items-center justify-between rounded-full px-4 text-[15px]', on ? 'bg-ink text-surface' : 'hover:bg-field')}>
            {l.label}{l.dot && needsDocs && !on && <span className="h-[9px] w-[9px] rounded-full bg-orange" aria-label="Action needed" />}
          </Link>
        );
      })}
      <button type="button" onClick={logout} className="flex h-12 items-center rounded-full px-4 text-left text-[15px] text-muted hover:bg-field">Log out</button>
    </nav>
  );
}
