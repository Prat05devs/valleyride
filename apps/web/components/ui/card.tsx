import * as React from 'react';
import { cn } from '@/lib/utils';

/** White card, radius 28, no border or shadow (the canvas does the separation). */
export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-card bg-surface p-5 text-ink', className)} {...p} />
);
export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('m-0 text-xl font-normal', className)} {...p} />
);
export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('m-0 text-sm text-muted', className)} {...p} />
);
