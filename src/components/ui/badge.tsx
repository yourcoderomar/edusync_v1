import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#D2D7DF] text-[#353535] hover:bg-[#B8BFC9]',
        secondary:
          'border-transparent bg-[#D2D7DF] text-[#353535] hover:bg-[#B8BFC9]',
        destructive:
          'border-transparent bg-[#D2D7DF] text-[#353535] hover:bg-[#B8BFC9]',
        outline: 'text-[#353535] border-[#353535]',
        success:
          'border-transparent bg-[#D2D7DF] text-[#353535] hover:bg-[#B8BFC9]',
        warning:
          'border-transparent bg-[#D2D7DF] text-[#353535] hover:bg-[#B8BFC9]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }





