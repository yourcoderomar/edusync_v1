import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'

interface SessionsPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: SessionsPageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)
  
  if (!result.success) {
    return {
      title: 'Class Not Found',
    }
  }

  const classData = (result as { success: true; data: { name: string } }).data

  return {
    title: `Sessions - ${classData.name}`,
    description: `View all sessions for ${classData.name}`,
  }
}

/**
 * Student sessions list page for a class
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS, verifies enrollment
 */
export default async function StudentSessionsPage({ params }: SessionsPageProps) {
  const { classId } = await params
  const user = await getUser()
  
  if (!user) {
    notFound()
  }

  const supabase = await createClient()

  // Verify student is enrolled in this class
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('class_id, user_id')
    .eq('user_id', user.id)
    .eq('class_id', classId)
    .single()

  if (!enrollment) {
    notFound()
  }

  // Fetch class and sessions
  const [classResult, sessionsResult] = await Promise.all([
    getClassById(classId),
    supabase
      .from('class_sessions')
      .select('id, session_date, starts_at, ends_at')
      .eq('class_id', classId)
      .order('session_date', { ascending: false }),
  ])

  if (!classResult.success || !classResult.data) {
    notFound()
  }

  const classData = classResult.data
  const sessions = sessionsResult.data || []

  // Get attendance for all sessions
  const sessionIds = sessions.map((s: any) => s.id)
  const { data: attendance } = sessionIds.length > 0
    ? await supabase
        .from('attendance')
        .select('session_id, status, marked_at')
        .eq('student_id', user.id)
        .in('session_id', sessionIds)
    : { data: [] }

  const attendanceMap = new Map()
  if (attendance) {
    attendance.forEach((a: any) => {
      attendanceMap.set(a.session_id, a)
    })
  }

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Class Sessions</h1>
            <p className="mt-2 text-gray-600">
              {classData.name}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/student/classes/${classId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Class
            </Link>
          </Button>
        </div>
      </header>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h2>
            <p className="text-gray-600 text-center max-w-md">
              No sessions have been scheduled for this class yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session: any) => {
            const sessionAttendance = attendanceMap.get(session.id)
            
            return (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {formatDate(session.session_date)}
                  </CardTitle>
                  <CardDescription>
                    {session.starts_at && session.ends_at ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4" />
                        {new Date(session.starts_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' - '}
                        {new Date(session.ends_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    ) : (
                      'No time specified'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessionAttendance && (
                    <div>
                      <p className="text-sm text-gray-500">Attendance</p>
                      <p className={`font-medium capitalize ${
                        sessionAttendance.status === 'present' ? 'text-green-600' :
                        sessionAttendance.status === 'absent' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {sessionAttendance.status}
                      </p>
                    </div>
                  )}
                  
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/student/classes/${classId}/sessions/${session.id}`}>
                      View Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

