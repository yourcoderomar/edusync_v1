import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { getAttendanceByClass } from '@/lib/actions/attendance/get-attendance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'

interface ClassAttendancePageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: ClassAttendancePageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)
  
  if (!result.success || !result.data) {
    return {
      title: 'Class Not Found',
    }
  }

  return {
    title: `Attendance - ${result.data.name}`,
    description: `View all attendance records for ${result.data.name}`,
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
 * Class attendance page (all sessions)
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function ClassAttendancePage({ params }: ClassAttendancePageProps) {
  const { classId } = await params
  
  // Fetch class and attendance in parallel
  const [classResult, attendanceResult] = await Promise.all([
    getClassById(classId),
    getAttendanceByClass(classId),
  ])

  if (!classResult.success || !classResult.data) {
    notFound()
  }

  const classData = classResult.data
  const attendance = attendanceResult.success ? attendanceResult.data : []

  // Calculate overall stats
  const stats = {
    total: attendance.length,
    present: attendance.filter((a: any) => a.status === 'present').length,
    absent: attendance.filter((a: any) => a.status === 'absent').length,
    late: attendance.filter((a: any) => a.status === 'late').length,
    excused: attendance.filter((a: any) => a.status === 'excused').length,
  }

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="mt-2 text-gray-600">
              {classData.name}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/classes/${classId}`}>Back to class</Link>
          </Button>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Records</CardTitle>
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
            <p className="text-xs text-gray-500">
              {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-gray-500">
              {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
            <p className="text-xs text-gray-500">
              {stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Excused</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.excused}</p>
            <p className="text-xs text-gray-500">
              {stats.total > 0 ? Math.round((stats.excused / stats.total) * 100) : 0}%
            </p>
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
              <p className="text-gray-500">No attendance records yet.</p>
              <Button asChild className="mt-4">
                <Link href={`/admin/classes/${classId}/sessions`}>
                  View sessions
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Attendance Records</CardTitle>
              <CardDescription>
                {attendance.length} record{attendance.length !== 1 ? 's' : ''} across all sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quiz Grade</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        {record.session?.session_date ? (
                          <time dateTime={record.session.session_date}>
                            {formatDate(record.session.session_date)}
                          </time>
                        ) : (
                          '-'
                        )}
                      </TableCell>
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
                      <TableCell className="max-w-xs truncate">
                        {record.notes || '-'}
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

