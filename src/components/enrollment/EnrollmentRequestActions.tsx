'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveEnrollmentRequest, rejectEnrollmentRequest } from '@/lib/actions/enrollment/manage-enrollment-requests'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import { Check, X } from 'lucide-react'

interface EnrollmentRequestActionsProps {
  requestId: string
}

/**
 * Enrollment request actions (approve/reject)
 * 
 * @accessibility Confirmation dialogs for destructive actions
 */
export function EnrollmentRequestActions({ requestId }: EnrollmentRequestActionsProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async () => {
    const confirmed = window.confirm('Are you sure you want to approve this enrollment request?')
    if (!confirmed) return

    try {
      setIsApproving(true)
      setError(null)

      const result = await approveEnrollmentRequest(requestId)

      if (!result.success) {
        setError(result.error || 'Failed to approve request')
        return
      }

      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Approve error:', err)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    const reason = window.prompt('Optional: Provide a reason for rejection')
    if (reason === null) return // User cancelled

    try {
      setIsRejecting(true)
      setError(null)

      const result = await rejectEnrollmentRequest(requestId, reason || undefined)

      if (!result.success) {
        setError(result.error || 'Failed to reject request')
        return
      }

      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Reject error:', err)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="text-sm text-red-600 mb-2" role="alert">
          {error}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          {isApproving ? (
            <>
              <Loader inline className="mr-2" />
              Approving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Approve
            </>
          )}
        </Button>

        <Button
          onClick={handleReject}
          disabled={isApproving || isRejecting}
          variant="destructive"
          size="sm"
        >
          {isRejecting ? (
            <>
              <Loader inline className="mr-2" />
              Rejecting...
            </>
          ) : (
            <>
              <X className="mr-2 h-4 w-4" />
              Reject
            </>
          )}
        </Button>
      </div>
    </div>
  )
}


