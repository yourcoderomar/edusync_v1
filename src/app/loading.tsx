import { Loader } from '@/components/common/Loader'

/**
 * Global loading component
 * 
 * @accessibility Proper ARIA attributes for screen readers
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Loader size="lg" text="Loading..." />
    </div>
  )
}

