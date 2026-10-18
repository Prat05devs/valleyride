import * as React from 'react';
import { cn } from '@/lib/utils';

/** Field label: muted 14px above the control. */
export const Label = ({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('label', className)} {...p} />
);
