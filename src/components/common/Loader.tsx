import { cn } from '@/lib/utils/cn'

// Generate unique IDs for clipPath elements
let clipPathCounter = 0
const getUniqueClipPathId = () => `pencil-eraser-${++clipPathCounter}`

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  inline?: boolean
  variant?: 'spinner' | 'pencil'
}

/**
 * Loading spinner component
 * Accessible with proper ARIA attributes
 */
export function Loader({ 
  size = 'md', 
  className, 
  text, 
  inline = false,
  variant = 'spinner'
}: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }

  const pencilSizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-40 h-40',
  }

  // Pencil loader variant
  if (variant === 'pencil') {
    const pencilSize = pencilSizeClasses[size]
    const uniqueId = getUniqueClipPathId()
    
    if (inline) {
      return (
        <>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            height="200px" 
            width="200px" 
            viewBox="0 0 200 200" 
            className={cn('pencil-loader', pencilSize, className)}
            aria-hidden="true"
            role="status"
          >
            <defs>
              <clipPath id={uniqueId}>
                <rect height={30} width={30} ry={5} rx={5} />
              </clipPath>
            </defs>
            <circle 
              transform="rotate(-113,100,100)" 
              strokeLinecap="round" 
              strokeDashoffset="439.82" 
              strokeDasharray="439.82 439.82" 
              strokeWidth={2} 
              stroke="currentColor" 
              fill="none" 
              r={70} 
              className="pencil-loader__stroke" 
            />
            <g transform="translate(100,100)" className="pencil-loader__rotate">
              <g fill="none">
                <circle 
                  transform="rotate(-90)" 
                  strokeDashoffset={402} 
                  strokeDasharray="402.12 402.12" 
                  strokeWidth={30} 
                  stroke="hsl(223,90%,50%)" 
                  r={64} 
                  className="pencil-loader__body1" 
                />
                <circle 
                  transform="rotate(-90)" 
                  strokeDashoffset={465} 
                  strokeDasharray="464.96 464.96" 
                  strokeWidth={10} 
                  stroke="hsl(223,90%,60%)" 
                  r={74} 
                  className="pencil-loader__body2" 
                />
                <circle 
                  transform="rotate(-90)" 
                  strokeDashoffset={339} 
                  strokeDasharray="339.29 339.29" 
                  strokeWidth={10} 
                  stroke="hsl(223,90%,40%)" 
                  r={54} 
                  className="pencil-loader__body3" 
                />
              </g>
              <g transform="rotate(-90) translate(49,0)" className="pencil-loader__eraser">
                <g className="pencil-loader__eraser-skew">
                  <rect height={30} width={30} ry={5} rx={5} fill="hsl(223,90%,70%)" />
                  <rect clipPath={`url(#${uniqueId})`} height={30} width={5} fill="hsl(223,90%,60%)" />
                  <rect height={20} width={30} fill="hsl(223,10%,90%)" />
                  <rect height={20} width={15} fill="hsl(223,10%,70%)" />
                  <rect height={20} width={5} fill="hsl(223,10%,80%)" />
                  <rect height={2} width={30} y={6} fill="hsla(223,10%,10%,0.2)" />
                  <rect height={2} width={30} y={13} fill="hsla(223,10%,10%,0.2)" />
                </g>
              </g>
              <g transform="rotate(-90) translate(49,-30)" className="pencil-loader__point">
                <polygon points="15 0,30 30,0 30" fill="hsl(33,90%,70%)" />
                <polygon points="15 0,6 30,0 30" fill="hsl(33,90%,50%)" />
                <polygon points="15 0,20 10,10 10" fill="hsl(223,10%,10%)" />
              </g>
            </g>
          </svg>
          <span className="sr-only">Loading...</span>
        </>
      )
    }

    return (
      <div className={cn('flex flex-col items-center justify-center gap-3', className)} role="status" aria-live="polite">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          height="200px" 
          width="200px" 
          viewBox="0 0 200 200" 
          className={cn('pencil-loader', pencilSize)}
          aria-hidden="true"
        >
          <defs>
            <clipPath id={uniqueId}>
              <rect height={30} width={30} ry={5} rx={5} />
            </clipPath>
          </defs>
          <circle 
            transform="rotate(-113,100,100)" 
            strokeLinecap="round" 
            strokeDashoffset="439.82" 
            strokeDasharray="439.82 439.82" 
            strokeWidth={2} 
            stroke="currentColor" 
            fill="none" 
            r={70} 
            className="pencil-loader__stroke" 
          />
          <g transform="translate(100,100)" className="pencil-loader__rotate">
            <g fill="none">
              <circle 
                transform="rotate(-90)" 
                strokeDashoffset={402} 
                strokeDasharray="402.12 402.12" 
                strokeWidth={30} 
                stroke="hsl(223,90%,50%)" 
                r={64} 
                className="pencil-loader__body1" 
              />
              <circle 
                transform="rotate(-90)" 
                strokeDashoffset={465} 
                strokeDasharray="464.96 464.96" 
                strokeWidth={10} 
                stroke="hsl(223,90%,60%)" 
                r={74} 
                className="pencil-loader__body2" 
              />
              <circle 
                transform="rotate(-90)" 
                strokeDashoffset={339} 
                strokeDasharray="339.29 339.29" 
                strokeWidth={10} 
                stroke="hsl(223,90%,40%)" 
                r={54} 
                className="pencil-loader__body3" 
              />
            </g>
            <g transform="rotate(-90) translate(49,0)" className="pencil-loader__eraser">
              <g className="pencil-loader__eraser-skew">
                <rect height={30} width={30} ry={5} rx={5} fill="hsl(223,90%,70%)" />
                <rect clipPath={`url(#${uniqueId})`} height={30} width={5} fill="hsl(223,90%,60%)" />
                <rect height={20} width={30} fill="hsl(223,10%,90%)" />
                <rect height={20} width={15} fill="hsl(223,10%,70%)" />
                <rect height={20} width={5} fill="hsl(223,10%,80%)" />
                <rect height={2} width={30} y={6} fill="hsla(223,10%,10%,0.2)" />
                <rect height={2} width={30} y={13} fill="hsla(223,10%,10%,0.2)" />
              </g>
            </g>
            <g transform="rotate(-90) translate(49,-30)" className="pencil-loader__point">
              <polygon points="15 0,30 30,0 30" fill="hsl(33,90%,70%)" />
              <polygon points="15 0,6 30,0 30" fill="hsl(33,90%,50%)" />
              <polygon points="15 0,20 10,10 10" fill="hsl(223,10%,10%)" />
            </g>
          </g>
        </svg>
        {text && <p className="text-sm text-[#353535]">{text}</p>}
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  // Default spinner loader
  // If inline, just return the spinner
  if (inline) {
    return (
      <>
        <div
          className={cn(
            'animate-spin rounded-full border-[#353535]/30 border-t-[#353535]',
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

