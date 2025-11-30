import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[#353535] bg-white px-3 py-2 text-sm text-[#353535] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#353535]/50 focus-visible:outline-none focus-visible:border-[#353535] focus-visible:border-2 focus-visible:ring-2 focus-visible:ring-[#353535]/20 transition-all disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }

