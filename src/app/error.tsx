'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Error boundary component
 * 
 * @semantic Uses semantic HTML
 * @security Doesn't expose sensitive error details
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <main className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-4 text-gray-600">
          We apologize for the inconvenience. Please try again.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Go home
          </Button>
        </div>
      </main>
    </div>
  )
}

