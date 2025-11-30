'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteClass } from '@/lib/actions/classes/delete-class'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import { Trash2 } from 'lucide-react'

interface DeleteClassButtonProps {
  classId: string
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

/**
 * Delete class button with confirmation
 * 
 * @accessibility Confirmation dialog for destructive action
 */
export function DeleteClassButton({ 
  classId, 
  className,
  variant = 'destructive' 
}: DeleteClassButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this class? This action cannot be undone and will delete all associated sessions, enrollments, attendance records, and quizzes.'
    )

    if (!confirmed) return

    try {
      setIsDeleting(true)
      setError(null)

      const result = await deleteClass({ id: classId })

      if (!result.success) {
        setError(result.error || 'Failed to delete class')
        return
      }

      router.push('/admin/classes')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Delete class error:', err)
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
        variant={variant}
        onClick={handleDelete}
        disabled={isDeleting}
        className={className}
      >
        {isDeleting ? (
          <>
            <Loader inline className="mr-2" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete class
          </>
        )}
      </Button>
    </>
  )
}

