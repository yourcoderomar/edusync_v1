'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createInstructorEnrollment } from '@/lib/actions/instructor-enrollments/create-instructor-enrollment'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'

interface EnrollWithInstructorButtonProps {
  instructorId: string
  disabled?: boolean
}

export function EnrollWithInstructorButton({ instructorId, disabled }: EnrollWithInstructorButtonProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const result = await createInstructorEnrollment(instructorId)

      if (!result.success) {
        setError(result.error || 'Failed to enroll with instructor')
        return
      }

      router.refresh()
    } catch (err) {
      console.error('Enroll with instructor error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      <Button
        size="sm"
        onClick={handleClick}
        disabled={disabled || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader inline className="mr-2" />
            Enrolling...
          </>
        ) : (
          'Enroll with Instructor'
        )}
      </Button>
    </div>
  )
}


