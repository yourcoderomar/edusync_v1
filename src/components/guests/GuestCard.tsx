'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import { deleteGuestAccount } from '@/lib/actions/guests/delete-guest'
import { formatDate } from '@/lib/utils/format'
import { Trash2 } from 'lucide-react'

interface GuestCardProps {
  guest: {
    id: string
    full_name: string | null
    phone: string | null
    parent_phone_number: string | null
    created_at: string
    enrollmentCount: number
    instructorEnrollmentCount: number
  }
}

/**
 * Guest account card component
 * 
 * @semantic Uses semantic HTML
 */
export function GuestCard({ guest }: GuestCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this guest account? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      setError(null)

      const result = await deleteGuestAccount({ guestId: guest.id })

      if (!result.success) {
        setError(result.error || 'Failed to delete guest account')
        return
      }

      router.refresh()
    } catch (err) {
      console.error('Delete guest account error:', err)
      setError('An unexpected error occurred while deleting the guest account.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Link href={`/admin/students/${guest.id}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:border-teal-200 group cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate group-hover:text-teal-600 transition-colors">
                {guest.full_name || 'Unnamed Guest'}
              </CardTitle>
            {guest.phone && (
              <p className="text-sm text-gray-500 truncate mt-1">{guest.phone}</p>
            )}
            {guest.parent_phone_number && (
              <p className="text-xs text-gray-400 truncate mt-1">
                Parent: {guest.parent_phone_number}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-shrink-0"
            aria-label={`Delete guest account for ${guest.full_name || 'guest'}`}
          >
            {isDeleting ? (
              <Loader size="sm" inline />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          {error && (
            <p className="text-red-600 text-xs" role="alert">
              {error}
            </p>
          )}
          <p>
            <span className="font-medium">Created:</span>{' '}
            <time dateTime={guest.created_at}>
              {formatDate(guest.created_at)}
            </time>
          </p>
          <div className="flex gap-4 pt-2">
            <div>
              <span className="font-medium">{guest.enrollmentCount}</span>
              <span className="text-gray-500 ml-1">classes</span>
            </div>
            <div>
              <span className="font-medium">{guest.instructorEnrollmentCount}</span>
              <span className="text-gray-500 ml-1">instructors</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  )
}

