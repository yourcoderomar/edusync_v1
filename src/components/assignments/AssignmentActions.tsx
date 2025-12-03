'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical } from 'lucide-react'
import { deleteAssignment } from '@/lib/actions/assignments/delete-assignment'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface AssignmentActionsProps {
  assignmentId: string
  classId: string
  sessionId: string
}

/**
 * Kebab menu (3 dots) for assignment cards with Edit/Delete actions.
 */
export function AssignmentActions({
  assignmentId,
  classId,
  sessionId,
}: AssignmentActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this assignment?')) return

    setIsDeleting(true)
    startTransition(async () => {
      const result = await deleteAssignment({ assignmentId, classId, sessionId })
      setIsDeleting(false)

      if (!result.success) {
        alert(result.error || 'Failed to delete assignment')
        return
      }

      router.refresh()
    })
  }

  return (
    <DropdownMenu
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          aria-label="Assignment actions"
          disabled={isPending || isDeleting}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      }
      align="right"
    >
      <DropdownMenuItem
        href={`/admin/classes/${classId}/sessions/${sessionId}/assignments/${assignmentId}/edit`}
      >
        Edit assignment
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={handleDelete}
        className="text-red-600 focus:text-red-600"
      >
        {isDeleting ? 'Deleting…' : 'Delete assignment'}
      </DropdownMenuItem>
    </DropdownMenu>
  )
}


