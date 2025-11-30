'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/dialog'
import { deleteClass } from '@/lib/actions/classes/delete-class'
import { formatDate } from '@/lib/utils/format'

interface ClassCardProps {
  classItem: {
    id: string
    name: string
    description: string | null
    created_at: string
    teacher_id: string
  }
  canEdit: boolean
  canDelete: boolean
}

/**
 * Class card component with 3-dots menu
 * 
 * @accessibility Proper ARIA labels and keyboard navigation
 */
export function ClassCard({ classItem, canEdit, canDelete }: ClassCardProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)

      const result = await deleteClass({ id: classItem.id })

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
      <article>
        <Card className="h-full transition-shadow hover:shadow-md relative">
          {/* 3-dots menu button */}
          {(canEdit || canDelete) && (
            <div 
              className="absolute top-4 right-4 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    type="button"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                }
                align="right"
              >
                {canEdit && (
                  <DropdownMenuItem
                    asChild
                  >
                    <Link href={`/admin/classes/${classItem.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => {
                      setShowDeleteModal(true)
                    }}
                    onSelect={() => {
                      setShowDeleteModal(true)
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenu>
            </div>
          )}

          {/* Card content - clickable to view details */}
          <Link href={`/admin/classes/${classItem.id}`} className="block">
            <CardHeader>
              <CardTitle className="line-clamp-1 pr-8">{classItem.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {classItem.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">
                <time dateTime={classItem.created_at}>
                  Created {formatDate(classItem.created_at)}
                </time>
              </div>
            </CardContent>
          </Link>
        </Card>
      </article>

      {/* Delete confirmation modal */}
      <ConfirmDialog
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Class"
        description="Are you sure you want to delete this class? This action cannot be undone and will delete all associated sessions, enrollments, attendance records, and quizzes."
        onConfirm={handleDelete}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        variant="destructive"
      />

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md shadow-lg z-50" role="alert">
          {error}
        </div>
      )}
    </>
  )
}

