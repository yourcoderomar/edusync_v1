import { cn } from '@/lib/utils/cn'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  inline?: boolean
}

/**
 * Loading spinner component
 * Accessible with proper ARIA attributes
 */
export function Loader({ size = 'md', className, text, inline = false }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }

  // If inline, just return the spinner
  if (inline) {
    return (
      <>
        <div
          className={cn(
            'animate-spin rounded-full border-gray-300 border-t-blue-600',
            sizeClasses[size],
            className
          )}
          aria-hidden="true"
          role="status"
        />
        <span className="sr-only">Loading...</span>
      </>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)} role="status" aria-live="polite">
      <div
        className={cn(
          'animate-spin rounded-full border-gray-300 border-t-blue-600',
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {text && <p className="text-sm text-gray-600">{text}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

