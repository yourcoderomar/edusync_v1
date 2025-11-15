import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { getStudentsForAttendance } from '@/lib/actions/attendance/mark-attendance'
import { Button } from '@/components/ui/button'
import { AttendanceForm } from '@/components/attendance/AttendanceForm'
import { formatDate } from '@/lib/utils/format'

interface MarkAttendancePageProps {
  params: Promise<{ classId: string; sessionId: string }>
}

export async function generateMetadata({ params }: MarkAttendancePageProps): Promise<Metadata> {
  const { sessionId } = await params
  const result = await getSessionById(sessionId)
  
  if (!result.success || !result.data) {
    return {
      title: 'Session Not Found',
    }
  }

  const session = result.data
  const classData = session.classes as any

  return {
    title: `Mark Attendance - ${formatDate(session.session_date)}`,
    description: `Mark attendance for ${classData?.name || 'class'} session`,
  }
}

/**
 * Mark attendance page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching, client form with server action
 */
export default async function MarkAttendancePage({ params }: MarkAttendancePageProps) {
  const { classId, sessionId } = await params
  
  // Fetch session and students in parallel
  const [sessionResult, studentsResult] = await Promise.all([
    getSessionById(sessionId),
    getStudentsForAttendance(classId, sessionId),
  ])

  if (!sessionResult.success || !sessionResult.data) {
    notFound()
  }

  const session = sessionResult.data
  const classData = session.classes as any
  const students = studentsResult.success ? studentsResult.data : []

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'} - {formatDate(session.session_date)}
            </p>
            {students.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {students.length} student{students.length !== 1 ? 's' : ''} enrolled
              </p>
            )}
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/classes/${classId}/sessions/${sessionId}/attendance`}>
              Back to attendance
            </Link>
          </Button>
        </div>
      </header>

      {!studentsResult.success ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{studentsResult.error}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            No students enrolled in this class yet.{' '}
            <Link href={`/admin/classes/${classId}`} className="underline">
              Manage enrollments
            </Link>
          </p>
        </div>
      ) : (
        <AttendanceForm
          classId={classId}
          sessionId={sessionId}
          students={students}
        />
      )}
    </>
  )
}

