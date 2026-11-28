import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
        success: 'border-success/40 bg-success-background text-success-foreground',
        warning: 'border-warning/40 bg-warning-background text-warning-foreground',
        info: 'border-info/40 bg-info-background text-info-foreground',
        taxonomy1: 'border-transparent bg-taxonomy-1 text-taxonomy-1-foreground',
        taxonomy2: 'border-transparent bg-taxonomy-2 text-taxonomy-2-foreground',
        taxonomy3: 'border-transparent bg-taxonomy-3 text-taxonomy-3-foreground',
        taxonomy4: 'border-transparent bg-taxonomy-4 text-taxonomy-4-foreground',
        taxonomy5: 'border-transparent bg-taxonomy-5 text-taxonomy-5-foreground',
        taxonomy6: 'border-transparent bg-taxonomy-6 text-taxonomy-6-foreground',
        taxonomy7: 'border-transparent bg-taxonomy-7 text-taxonomy-7-foreground',
        taxonomy8: 'border-transparent bg-taxonomy-8 text-taxonomy-8-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
