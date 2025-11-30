import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatRelativeTime } from '@/lib/utils/format'
import { Calendar, Clock, FileText, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Student Dashboard',
  description: 'View your enrolled classes, upcoming sessions, and quiz results.',
}

/**
 * Student dashboard page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) {
    return null
  }

  // Fetch dashboard statistics
  const [enrolledClassesResult, quizAttemptsResult, instructorCountResult] = await Promise.all([
    supabase
      .from('enrollments')
      .select('class_id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .not('score', 'is', null),
    supabase
      .from('instructor_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('status', 'approved'),
  ])

  const stats = [
    {
      title: 'Enrolled Classes',
      value: enrolledClassesResult.count || 0,
      description: 'Classes you are currently enrolled in',
    },
    {
      title: 'Current Instructors',
      value: instructorCountResult.count || 0,
      description: 'Instructors you are enrolled with',
    },
    {
      title: 'Completed Quizzes',
      value: quizAttemptsResult.count || 0,
      description: 'Total quizzes you have completed',
    },
  ]

  type InstructorProfile = {
    id: string
    full_name: string | null
    phone: string | null
    profile_picture_url: string | null
  }

  type InstructorEnrollmentWithProfile = {
    id: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    instructor: InstructorProfile | null
  }

  // Fetch enrolled instructors
  const { data: instructorEnrollments, error: instructorEnrollmentsError } = await supabase
    .from('instructor_enrollments')
    .select(
      `
        id,
        status,
        created_at,
        instructor:profiles!instructor_enrollments_instructor_id_fkey (
          id,
          full_name,
          phone,
          profile_picture_url
        )
      `
    )
    .eq('student_id', user.id)
    .eq('status', 'approved')

  if (instructorEnrollmentsError) {
    console.error('Error fetching instructor enrollments:', instructorEnrollmentsError)
  }

  const typedInstructorEnrollments = (instructorEnrollments || []) as InstructorEnrollmentWithProfile[]

  // Fetch enrolled class IDs
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('class_id')
    .eq('user_id', user.id)

  const enrolledClassIds = (enrollments || []).map((e: any) => e.class_id)

  // Fetch upcoming sessions (today and tomorrow only)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD format
  const tomorrowStr = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD format

  const { data: upcomingSessions } = enrolledClassIds.length > 0
    ? await supabase
        .from('class_sessions')
        .select(`
          id,
          session_date,
          starts_at,
          ends_at,
          classes!inner (
            id,
            name
          )
        `)
        .in('class_id', enrolledClassIds)
        .gte('session_date', todayStr)
        .lte('session_date', tomorrowStr)
        .order('session_date', { ascending: true })
        .order('starts_at', { ascending: true })
    : { data: [] }

  // Fetch recent quiz attempts with scores (last 5)
  const { data: recentQuizAttempts } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      score,
      submitted_at,
      quiz:quizzes!inner (
        id,
        title,
        class_id,
        classes!inner (
          id,
          name
        )
      )
    `)
    .eq('student_id', user.id)
    .not('submitted_at', 'is', null)
    .not('score', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(5)

  return (
    <>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">Student Dashboard</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          Welcome back! Here&apos;s an overview of your learning journey.
        </p>
      </header>

      <section aria-labelledby="stats-heading" className="mb-8">
        <h2 id="stats-heading" className="sr-only">
          Dashboard Statistics
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="instructors-heading" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle id="instructors-heading">My Instructors</CardTitle>
            <CardDescription>
              Instructors you are currently enrolled with
            </CardDescription>
          </CardHeader>
          <CardContent>
            {typedInstructorEnrollments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                You are not enrolled with any instructors yet. Visit the Instructors page to get started.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {typedInstructorEnrollments.map((enrollment) => {
                  const instructor = enrollment.instructor
                  if (!instructor) return null

                  const initials = (instructor.full_name || 'U')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)

                  return (
                    <Link
                      key={enrollment.id}
                      href={`/student/instructors/${instructor.id}`}
                      className="flex flex-col items-center group"
                    >
                      {instructor.profile_picture_url ? (
                        <div className="relative h-16 w-16 rounded-full overflow-hidden mb-2">
                          <Image
                            src={instructor.profile_picture_url}
                            alt={`${instructor.full_name || 'Instructor'}'s profile picture`}
                            fill
                            className="object-cover group-hover:opacity-80 transition-opacity"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-semibold text-lg mb-2 group-hover:opacity-80 transition-opacity">
                          {initials}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 text-center group-hover:text-teal-600 transition-colors">
                        {instructor.full_name || 'Unnamed Instructor'}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Upcoming Sessions */}
      {enrolledClassIds.length > 0 && (
        <section aria-labelledby="upcoming-sessions-heading" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle id="upcoming-sessions-heading">Upcoming Sessions</CardTitle>
              <CardDescription>
                Your next scheduled class sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!upcomingSessions || upcomingSessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming sessions scheduled.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session: any) => {
                    const classData = session.classes
                    const sessionDate = new Date(session.session_date)
                    const isToday = sessionDate.toDateString() === new Date().toDateString()
                    
                    return (
                      <Link
                        key={session.id}
                        href={`/student/classes/${classData.id}/sessions/${session.id}`}
                        className="block"
                      >
                        <article className="border border-gray-200 rounded-xl p-4 hover:border-teal-200 hover:bg-teal-50 transition-all duration-200">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {classData.name}
                                </h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                                <span className="flex items-center gap-1">
                                  {isToday ? (
                                    <span className="text-teal-600 font-medium">Today</span>
                                  ) : (
                                    formatDate(session.session_date)
                                  )}
                                </span>
                                {session.starts_at && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(session.starts_at).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {session.ends_at && (
                                      <>
                                        {' - '}
                                        {new Date(session.ends_at).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Recent Quiz Grades */}
      <section aria-labelledby="recent-quizzes-heading" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle id="recent-quizzes-heading">Recent Quiz Grades</CardTitle>
            <CardDescription>
              Your latest quiz results and scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!recentQuizAttempts || recentQuizAttempts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No quiz grades yet. Complete quizzes to see your results here.
              </p>
            ) : (
              <div className="space-y-3">
                {recentQuizAttempts.map((attempt: any) => {
                  const quiz = attempt.quiz
                  const classData = quiz?.classes
                  const score = attempt.score as number
                  const scoreColor = score >= 70 ? 'text-teal-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
                  
                  return (
                    <Link
                      key={attempt.id}
                      href={`/student/classes/${classData?.id}/quizzes/${quiz?.id}`}
                      className="block"
                    >
                      <article className="border border-gray-200 rounded-xl p-4 hover:border-teal-200 hover:bg-teal-50 transition-all duration-200">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <h3 className="font-semibold text-gray-900 truncate">
                                {quiz?.title || 'Quiz'}
                              </h3>
                            </div>
                            {classData && (
                              <p className="text-sm text-gray-600 mb-2">
                                {classData.name}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                Submitted {formatRelativeTime(attempt.submitted_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${scoreColor}`}>
                                {score}%
                              </p>
                              {score >= 70 && (
                                <CheckCircle2 className="h-5 w-5 text-teal-600 mt-1 mx-auto" />
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}

