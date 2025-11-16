import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { getQuizzesBySession } from '@/lib/actions/quizzes/get-quizzes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { Calendar, Clock, CheckCircle2, XCircle, FileText, UserCheck } from 'lucide-react'

interface SessionViewPageProps {
  params: Promise<{ classId: string; sessionId: string }>
}

export async function generateMetadata({ params }: SessionViewPageProps): Promise<Metadata> {
  const { sessionId } = await params
  const supabase = await createClient()
  
  const { data: session } = await supabase
    .from('class_sessions')
    .select('session_date, classes:class_id(name)')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return {
      title: 'Session Not Found',
    }
  }

  const classData = session.classes as any

  return {
    title: `Session - ${formatDate(session.session_date)}`,
    description: `View session details for ${classData?.name || 'class'}`,
  }
}

/**
 * Student session view page
 * Shows session details, attendance status, and quizzes
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS, verifies enrollment
 */
export default async function StudentSessionViewPage({ params }: SessionViewPageProps) {
  const { classId, sessionId } = await params
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

  // Fetch session data, attendance, and quizzes in parallel
  const [sessionResult, attendanceResult, quizzesResult] = await Promise.all([
    supabase
      .from('class_sessions')
      .select(`
        id,
        session_date,
        starts_at,
        ends_at,
        classes:class_id (
          id,
          name
        )
      `)
      .eq('id', sessionId)
      .eq('class_id', classId)
      .single(),
    // Get student's attendance for this session
    supabase
      .from('attendance')
      .select('id, status, marked_at')
      .eq('session_id', sessionId)
      .eq('student_id', user.id)
      .maybeSingle(),
    // Get quizzes for this session
    getQuizzesBySession(sessionId),
  ])

  if (!sessionResult.data) {
    notFound()
  }

  const session = sessionResult.data as any
  const classData = session.classes as any
  const attendance = attendanceResult.data
  
  if (!quizzesResult.success) {
    console.error('Error fetching quizzes:', quizzesResult.error)
  }
  
  const quizzes = quizzesResult.success ? (quizzesResult.data || []) : []

  // Get quiz attempts for this student
  const quizIds = (quizzes as any[]).map(q => q.id)
  const { data: quizAttempts } = quizIds.length > 0
    ? await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, submitted_at')
        .eq('student_id', user.id)
        .in('quiz_id', quizIds)
    : { data: [] }

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Session - {formatDate(session.session_date)}
            </h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/student/classes/${classId}`}>Back to Class</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Session Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Session Information
            </CardTitle>
            <CardDescription>Details about this class session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-lg font-medium">
                <time dateTime={session.session_date}>
                  {formatDate(session.session_date)}
                </time>
              </p>
            </div>
            {session.starts_at && (
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start Time
                </p>
                <p className="text-lg font-medium">
                  <time dateTime={session.starts_at}>
                    {new Date(session.starts_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </p>
              </div>
            )}
            {session.ends_at && (
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  End Time
                </p>
                <p className="text-lg font-medium">
                  <time dateTime={session.ends_at}>
                    {new Date(session.ends_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Attendance
            </CardTitle>
            <CardDescription>Your attendance status for this session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendance ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {attendance.status === 'present' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : attendance.status === 'absent' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className={`text-lg font-medium capitalize ${
                      attendance.status === 'present' ? 'text-green-600' :
                      attendance.status === 'absent' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {attendance.status}
                    </span>
                  </div>
                </div>
                {attendance.marked_at && (
                  <div>
                    <p className="text-sm text-gray-500">Marked At</p>
                    <p className="text-lg font-medium">
                      <time dateTime={attendance.marked_at}>
                        {formatDate(attendance.marked_at)}
                      </time>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(attendance.marked_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-2">Status</p>
                <p className="text-lg font-medium text-gray-400">Not marked</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quizzes Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Session Quizzes
          </CardTitle>
          <CardDescription>
            Quizzes available for this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No quizzes available for this session
            </p>
          ) : (
            <div className="space-y-3">
              {(quizzes as any[]).map((quiz) => {
                const attempt = (quizAttempts || []).find((qa: any) => qa.quiz_id === quiz.id)
                const isCompleted = attempt && attempt.submitted_at
                const hasScore = attempt && attempt.score !== null

                return (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                        {isCompleted && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            hasScore && attempt.score >= 70
                              ? 'bg-green-100 text-green-700'
                              : hasScore && attempt.score >= 50
                              ? 'bg-yellow-100 text-yellow-700'
                              : hasScore
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {hasScore ? `${attempt.score}%` : 'Submitted'}
                          </span>
                        )}
                      </div>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {quiz.description}
                        </p>
                      )}
                      {isCompleted && hasScore && (
                        <p className="text-xs text-gray-400 mt-1">
                          Completed on {formatDate(attempt.submitted_at)}
                        </p>
                      )}
                    </div>
                    <Button asChild variant={isCompleted ? "outline" : "default"} size="sm">
                      <Link href={`/student/classes/${classId}/quizzes/${quiz.id}`}>
                        {isCompleted ? 'Review' : 'Take Quiz'}
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

