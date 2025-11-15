import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { getAttendanceBySession, getAttendanceStats } from '@/lib/actions/attendance/get-attendance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'

interface AttendancePageProps {
  params: Promise<{ classId: string; sessionId: string }>
}

export async function generateMetadata({ params }: AttendancePageProps): Promise<Metadata> {
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
    title: `Attendance - ${formatDate(session.session_date)}`,
    description: `View attendance for ${classData?.name || 'class'} session`,
  }
}

/**
 * Get status badge color
 */
function getStatusColor(status: string) {
  switch (status) {
    case 'present':
      return 'bg-green-100 text-green-800'
    case 'absent':
      return 'bg-red-100 text-red-800'
    case 'late':
      return 'bg-yellow-100 text-yellow-800'
    case 'excused':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Session attendance page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function SessionAttendancePage({ params }: AttendancePageProps) {
  const { classId, sessionId } = await params
  
  // Fetch session, attendance, and stats in parallel
  const [sessionResult, attendanceResult, statsResult] = await Promise.all([
    getSessionById(sessionId),
    getAttendanceBySession(sessionId),
    getAttendanceStats(sessionId),
  ])

  if (!sessionResult.success || !sessionResult.data) {
    notFound()
  }

  const session = sessionResult.data
  const classData = session.classes as any
  const attendance = attendanceResult.success ? attendanceResult.data : []
  const stats = statsResult.success ? statsResult.data : { total: 0, present: 0, absent: 0, late: 0, excused: 0 }

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'} - {formatDate(session.session_date)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/classes/${classId}/sessions/${sessionId}`}>Back to session</Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/classes/${classId}/sessions/${sessionId}/attendance/mark`}>
                Mark attendance
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.present}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Excused</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.excused}</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <section aria-labelledby="attendance-heading">
        <h2 id="attendance-heading" className="sr-only">
          Attendance records
        </h2>

        {!attendanceResult.success ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-red-600">{attendanceResult.error}</p>
            </CardContent>
          </Card>
        ) : attendance.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No attendance records yet. Mark attendance to get started!</p>
              <Button asChild className="mt-4">
                <Link href={`/admin/classes/${classId}/sessions/${sessionId}/attendance/mark`}>
                  Mark attendance
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {attendance.length} student{attendance.length !== 1 ? 's' : ''} marked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quiz Grade</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Marked By</TableHead>
                    <TableHead>Marked At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record: any) => (
                    <TableRow key={`${record.session_id}-${record.student_id}`}>
                      <TableCell className="font-medium">
                        {record.student?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {record.student?.phone || '-'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {record.quiz_grade !== null ? `${record.quiz_grade}%` : '-'}
                      </TableCell>
                      <TableCell>
                        {record.notes || '-'}
                      </TableCell>
                      <TableCell>
                        {record.marked_by_user?.full_name || 'System'}
                      </TableCell>
                      <TableCell>
                        <time dateTime={record.marked_at}>
                          {new Date(record.marked_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  )
}

