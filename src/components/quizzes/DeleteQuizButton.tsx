'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteQuiz } from '@/lib/actions/quizzes/delete-quiz'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import { Trash2 } from 'lucide-react'

interface DeleteQuizButtonProps {
  quizId: string
  sessionId: string
  classId: string
}

/**
 * Delete quiz button with confirmation
 * 
 * @accessibility Confirmation dialog for destructive action
 */
export function DeleteQuizButton({ quizId, sessionId, classId }: DeleteQuizButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this quiz? This action cannot be undone and will delete all student attempts.'
    )

    if (!confirmed) return

    try {
      setIsDeleting(true)
      setError(null)

      const result = await deleteQuiz(quizId, sessionId, classId)

      if (!result.success) {
        setError(result.error || 'Failed to delete quiz')
        return
      }

      router.push(`/admin/classes/${classId}/sessions/${sessionId}/quizzes`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Delete quiz error:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <>
            <Loader inline className="mr-2" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete quiz
          </>
        )}
      </Button>
    </>
  )
}

