'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { removeStudentFromClass } from '@/lib/actions/enrollments/remove-student'
import { Trash2 } from 'lucide-react'

interface RemoveStudentButtonProps {
  studentId: string
  classId: string
  studentName: string
  onSuccess?: () => void
}

/**
 * Button component to remove a student from a class
 * 
 * @semantic Uses semantic HTML with proper ARIA labels
 */
export function RemoveStudentButton({
  studentId,
  classId,
  studentName,
  onSuccess,
}: RemoveStudentButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleRemove = () => {
    if (!showConfirm) {
      setShowConfirm(true)
      setError(null)
      return
    }

    startTransition(async () => {
      setError(null)
      const result = await removeStudentFromClass({ studentId, classId })

      if (result.success) {
        setShowConfirm(false)
        if (onSuccess) {
          onSuccess()
        } else {
          // Refresh the page if no callback provided
          router.refresh()
        }
      } else {
        setError(result.error || 'Failed to remove student')
        setShowConfirm(false)
      }
    })
  }

  const handleCancel = () => {
    setShowConfirm(false)
    setError(null)
  }

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600">
          Remove <strong>{studentName}</strong> from this class?
        </p>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending ? 'Removing...' : 'Confirm Remove'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRemove}
        disabled={isPending}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Remove
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

