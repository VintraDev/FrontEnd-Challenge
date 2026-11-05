import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva('ds-button', {
  variants: { variant: { default: 'ds-button--default', outline: 'ds-button--outline' } },
  defaultVariants: { variant: 'default' },
})
export { buttonVariants }
export function Button({ className, variant, type = 'button', ...props }: ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant, className }))} {...props} />
}
