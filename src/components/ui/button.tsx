import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-[#353535] text-[#ffffff] hover:bg-[#4B5563] focus-visible:ring-[#353535]',
        destructive: 'bg-[#D2D7DF] text-[#353535] hover:bg-[#B8BFC9] focus-visible:ring-[#353535]',
        outline: 'border border-[#353535] bg-white hover:bg-[#D2D7DF] text-[#353535] focus-visible:ring-[#353535]',
        secondary: 'bg-[#D2D7DF] text-[#353535] hover:bg-[#B8BFC9] focus-visible:ring-[#353535]',
        ghost: 'hover:bg-[#D2D7DF] text-[#353535] focus-visible:ring-[#353535]',
        link: 'text-[#353535] underline-offset-4 hover:text-[#353535] hover:underline focus-visible:ring-[#353535] transition-colors',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-xl px-3',
        lg: 'h-11 rounded-xl px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

