import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Pill buttons from the design: solid ink primary, white secondary, field grey, orange tint. */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-normal transition-[transform,opacity] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-disabled disabled:text-surface',
  {
    variants: {
      variant: {
        default: 'bg-ink text-surface hover:opacity-90',
        secondary: 'bg-surface text-ink hover:opacity-80',
        field: 'bg-field text-ink hover:opacity-80',
        tint: 'bg-orange-tint text-orange-ink',
        ghost: 'bg-transparent text-ink hover:bg-field',
        link: 'bg-transparent text-ink underline underline-offset-4',
      },
      size: { default: 'h-[50px] px-[22px] text-base', sm: 'h-11 px-[18px] text-[15px]', lg: 'h-[58px] px-7 text-lg', icon: 'h-11 w-11' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';

export { buttonVariants };
