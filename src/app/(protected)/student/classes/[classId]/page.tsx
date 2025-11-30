import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { getQuizzesByClass } from '@/lib/actions/quizzes/get-class-quizzes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { Calendar, FileText, Users } from 'lucide-react'
import type { Database } from '@/types/database'

interface ClassDetailsPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: ClassDetailsPageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)
  
  if (!result.success) {
    return {
      title: 'Class Not Found',
    }
  }

  // Type assertion: when success is true, data exists
  const classData = (result as { success: true; data: { name: string; description: string | null } }).data

  return {
    title: classData.name,
    description: classData.description || `View details for ${classData.name}`,
  }
}

/**
 * Student class details page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS, verifies enrollment
 */
export default async function StudentClassDetailsPage({ params }: ClassDetailsPageProps) {
  const { classId } = await params
  const user = await getUser()
  
  if (!user) {
    notFound()
  }

  const supabase = await createClient()

  type EnrollmentRow = Pick<Database['public']['Tables']['enrollments']['Row'], 'class_id' | 'user_id' | 'enrolled_at'>

  // Verify student is enrolled in this class
  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('class_id, user_id, enrolled_at')
    .eq('user_id', user.id)
    .eq('class_id', classId)
    .single()

  const enrollment = enrollmentData as EnrollmentRow | null

  if (!enrollment) {
    notFound()
  }

  // Fetch class data and related information in parallel
  const [classResult, sessionsResult, sessionsCountResult, quizzesResult] = await Promise.all([
    getClassById(classId),
    // Get recent sessions for this class (limit to 5 for display) - also used for attendance query
    supabase
      .from('class_sessions')
      .select('id, session_date, starts_at, ends_at')
      .eq('class_id', classId)
      .order('session_date', { ascending: false })
      .limit(5),
    // Get total count of sessions
    supabase
      .from('class_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId),
    // Get quizzes for this class
    getQuizzesByClass(classId),
  ])

  // Use session IDs from sessionsResult for attendance query (no extra query needed)
  const sessionIds = (sessionsResult.data || []).map((s: any) => s.id)
  const attendanceResult = sessionIds.length > 0
    ? await supabase
        .from('attendance')
        .select('id, status')
        .eq('student_id', user.id)
        .in('session_id', sessionIds)
    : { data: [] }

  if (!classResult.success || !classResult.data) {
    notFound()
  }

  const classData = classResult.data
  const creator = classData.creator as any
  const sessions = sessionsResult.data || []
  const quizzes = quizzesResult.success ? quizzesResult.data : []
  const totalSessions = sessionsCountResult.count || 0
  
  // Get attendance stats
  type AttendanceRow = Pick<Database['public']['Tables']['attendance']['Row'], 'id' | 'status'>
  const attendanceRecords = (attendanceResult.data || []) as AttendanceRow[]
  const presentCount = attendanceRecords.filter(a => a.status === 'present').length

  type QuizAttemptRow = Pick<Database['public']['Tables']['quiz_attempts']['Row'], 'quiz_id' | 'score' | 'submitted_at'>

  // Get quiz attempts for this student
  const quizIds = (quizzes as any[]).map(q => q.id)
  const { data: quizAttemptData } = quizIds.length > 0
    ? await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, submitted_at')
        .eq('student_id', user.id)
        .in('quiz_id', quizIds)
    : { data: [] }

  const quizAttempts = (quizAttemptData || []) as QuizAttemptRow[]
  const completedQuizzes = quizAttempts.filter((qa) => qa.submitted_at !== null).length

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
            <p className="mt-2 text-gray-600">
              {classData.description || 'No description provided'}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Instructor:</span> {creator?.full_name || 'Unknown'}
              </div>
              <div>
                <time dateTime={enrollment.enrolled_at}>
                  Enrolled {formatDate(enrollment.enrolled_at)}
                </time>
              </div>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/student/my-learning">Back to My Learning</Link>
          </Button>
        </div>
      </header>

      {/* Statistics */}
      <section aria-labelledby="stats-heading" className="mb-8">
        <h2 id="stats-heading" className="sr-only">Class Statistics</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
              <p className="mt-1 text-sm text-gray-500">Total sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{quizzes.length}</p>
              <p className="mt-1 text-sm text-gray-500">{completedQuizzes} completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{presentCount}</p>
              <p className="mt-1 text-sm text-gray-500">Present sessions</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sessions</CardTitle>
                <CardDescription>Recent class sessions</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/student/classes/${classId}/sessions`}>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No sessions scheduled yet
              </p>
            ) : (
              <div className="space-y-3">
                {(sessions as any[]).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(session.session_date)}
                      </p>
                      {session.starts_at && (
                        <p className="text-sm text-gray-500">
                          {new Date(session.starts_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {session.ends_at && ` - ${new Date(session.ends_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                        </p>
                      )}
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/student/classes/${classId}/sessions/${session.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quizzes</CardTitle>
                <CardDescription>Available and completed quizzes</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/student/classes/${classId}/quizzes`}>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No quizzes available yet
              </p>
            ) : (
              <div className="space-y-3">
                {(quizzes as any[]).slice(0, 5).map((quiz) => {
                  const attempt = quizAttempts.find((qa) => qa.quiz_id === quiz.id)
                  const isCompleted = attempt && attempt.submitted_at
                  const session = quiz.session as any
                  
                  return (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{quiz.title}</p>
                        {quiz.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {quiz.description}
                          </p>
                        )}
                        {session && (
                          <p className="text-xs text-gray-400 mt-1">
                            Session: {formatDate(session.session_date)}
                          </p>
                        )}
                        {isCompleted && attempt.score !== null && (
                          <p className="text-xs text-blue-600 mt-1">
                            Score: {attempt.score}%
                          </p>
                        )}
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/student/classes/${classId}/quizzes/${quiz.id}`}>
                          {isCompleted ? 'Review' : 'Take'}
                        </Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

