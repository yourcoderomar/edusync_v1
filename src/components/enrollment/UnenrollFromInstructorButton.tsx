'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { removeInstructorEnrollment } from '@/lib/actions/instructor-enrollments/remove-instructor-enrollment'
import { Trash2 } from 'lucide-react'

interface UnenrollFromInstructorButtonProps {
  studentId: string
  instructorId: string
  instructorName: string
  onSuccess?: () => void
}

/**
 * Button component to unenroll a student from an instructor
 * 
 * @semantic Uses semantic HTML with proper ARIA labels
 */
export function UnenrollFromInstructorButton({
  studentId,
  instructorId,
  instructorName,
  onSuccess,
}: UnenrollFromInstructorButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleUnenroll = async () => {
    setError(null)
    
    try {
      const result = await removeInstructorEnrollment({ studentId, instructorId })

      if (result.success) {
        setShowConfirm(false)
        if (onSuccess) {
          onSuccess()
        } else {
          // Redirect to students page after successful deletion
          router.push('/admin/students')
        }
      } else {
        const errorMsg = result.error || 'Failed to remove instructor enrollment'
        setError(errorMsg)
        // Don't close dialog on error so user can see the error message
        throw new Error(errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMsg)
      throw error
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setShowConfirm(true)
          setError(null)
        }}
        disabled={isPending}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Unenroll
      </Button>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setShowConfirm(false)
            setError(null)
          }
        }}
        title="Unenroll from Instructor"
        description={`Are you sure you want to unenroll from ${instructorName}? This action cannot be undone.`}
        onConfirm={handleUnenroll}
        confirmText={isPending ? 'Removing...' : 'Confirm Unenroll'}
        cancelText="Cancel"
        variant="destructive"
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </>
  )
}

