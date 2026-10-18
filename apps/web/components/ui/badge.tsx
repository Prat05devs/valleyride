import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Status pills: field grey, solid ink, orange tint. */
const badgeVariants = cva('inline-flex h-[30px] items-center whitespace-nowrap rounded-full px-3 text-sm font-normal', {
  variants: {
    variant: {
      default: 'bg-field text-ink',
      ink: 'bg-ink text-surface',
      orange: 'bg-orange-tint text-orange-ink',
      white: 'bg-surface text-ink',
    },
  },
  defaultVariants: { variant: 'default' },
});

export const Badge = ({ className, variant, ...p }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) => (
  <span className={cn(badgeVariants({ variant }), className)} {...p} />
);
