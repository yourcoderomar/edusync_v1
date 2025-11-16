'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEnrollmentRequest } from '@/lib/actions/enrollment/manage-enrollment-requests'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface RequestEnrollmentButtonProps {
  classId: string
  className?: string
  isReapplying?: boolean
}

/**
 * Request enrollment button
 * 
 * @accessibility Proper loading states and error messages
 */
export function RequestEnrollmentButton({ classId, className, isReapplying = false }: RequestEnrollmentButtonProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequest = async () => {
    const notes = window.prompt('Optional: Add a note to your enrollment request')
    if (notes === null) return // User cancelled

    try {
      setIsSubmitting(true)
      setError(null)

      const result = await createEnrollmentRequest(classId, notes || undefined)

      if (!result.success) {
        setError(result.error || 'Failed to create enrollment request')
        return
      }

      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Request enrollment error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="text-sm text-red-600 mb-2" role="alert">
          {error}
        </div>
      )}
      
      <Button
        onClick={handleRequest}
        disabled={isSubmitting}
        size="sm"
        className={cn('', className)}
      >
        {isSubmitting ? (
          <>
            <Loader inline className="mr-2" />
            Requesting...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            {isReapplying ? 'Request Again' : 'Request Enrollment'}
          </>
        )}
      </Button>
    </div>
  )
}

