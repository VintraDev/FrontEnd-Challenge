import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'ds-button inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-(--button-radius) border border-transparent px-6 py-3 font-mono text-xs font-bold not-disabled:active:scale-(--press-scale) disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled disabled:text-disabled-foreground motion-reduce:not-disabled:active:transform-none',
  {
    variants: {
      variant: {
        default:
          'ds-button--default bg-primary text-primary-foreground not-disabled:hover:bg-(--button-primary-hover-bg) not-disabled:hover:text-primary-foreground not-disabled:active:bg-primary-hover',
        outline:
          'ds-button--outline border-primary bg-transparent text-primary not-disabled:hover:bg-surface-raised not-disabled:active:bg-surface-raised',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);
export { buttonVariants };
export function Button({
  className,
  variant,
  type = 'button',
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant, className }))} {...props} />;
}
