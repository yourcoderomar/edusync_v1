'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markStudentAttendance } from '@/lib/actions/attendance/mark-student-attendance'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import { CheckCircle2 } from 'lucide-react'

interface MarkAttendanceButtonProps {
  sessionId: string
  classId: string
}

export function MarkAttendanceButton({ sessionId, classId }: MarkAttendanceButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isMarked, setIsMarked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleMarkAttendance = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await markStudentAttendance(sessionId, classId)
      
      if (result.success) {
        setIsMarked(true)
        // Refresh the page to show updated attendance
        router.refresh()
      } else {
        setError(result.error || 'Failed to mark attendance')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isMarked) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Attendance marked successfully!</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleMarkAttendance} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader className="mr-2 h-4 w-4" />
            Marking...
          </>
        ) : (
          'Mark Attendance'
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

