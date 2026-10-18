import { cn } from '@/lib/utils';

export const PageTitle = ({ title, sub, children, eyebrow }: { title: React.ReactNode; sub?: React.ReactNode; eyebrow?: React.ReactNode; children?: React.ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>{eyebrow && <span className="text-sm text-muted">{eyebrow}</span>}<h1 className="m-0 text-[36px] font-normal tracking-[-0.5px]">{title}</h1>{sub && <p className="mt-1 text-base text-muted">{sub}</p>}</div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
);

export const Panel = ({ title, children, className, action }: { title?: React.ReactNode; children: React.ReactNode; className?: string; action?: React.ReactNode }) => (
  <section className={cn('flex flex-col gap-3 rounded-sheet bg-surface p-[22px]', className)}>
    {(title || action) && <div className="flex items-center justify-between gap-3">{title && <h2 className="m-0 text-xl font-normal">{title}</h2>}{action}</div>}
    {children}
  </section>
);

export const Stat = ({ label, value, sub, dark, subTone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; dark?: boolean; subTone?: 'orange' }) => (
  <div className={cn('rounded-card p-[22px]', dark ? 'bg-ink text-surface' : 'bg-surface')}>
    <div className={cn('text-sm', dark ? 'text-white/80' : 'text-muted')}>{label}</div>
    <div className="mt-1 text-[34px] font-medium">{value}</div>
    {sub && <div className={cn('text-sm', dark ? 'text-white/80' : subTone === 'orange' ? 'text-orange-ink' : 'text-muted')}>{sub}</div>}
  </div>
);

export const KV = ({ k, v, tone }: { k: string; v: React.ReactNode; tone?: 'orange' }) => (
  <div className="flex justify-between gap-2.5 text-[15px]"><span className="text-muted">{k}</span><span className={cn('text-right', tone === 'orange' && 'text-orange-ink')}>{v}</span></div>
);
