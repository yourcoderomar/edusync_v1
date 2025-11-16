import type { Metadata } from 'next'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'

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
  const [enrolledClassesResult, quizAttemptsResult] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id),
    supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('status', 'graded'),
  ])

  const stats = [
    {
      title: 'Enrolled Classes',
      value: enrolledClassesResult.count || 0,
      description: 'Classes you are currently enrolled in',
    },
    {
      title: 'Completed Quizzes',
      value: quizAttemptsResult.count || 0,
      description: 'Total quizzes you have completed',
    },
  ]

  // Fetch enrolled classes
  const { data: enrolledClasses } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrolled_at,
      classes:class_id (
        id,
        name,
        description
      )
    `)
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(5)
  
  const classesList = (enrolledClasses || []) as Array<{ id: string; enrolled_at: string; classes: any }>

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here&apos;s an overview of your learning journey.
        </p>
      </header>

      <section aria-labelledby="stats-heading" className="mb-8">
        <h2 id="stats-heading" className="sr-only">
          Dashboard Statistics
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
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

      <section aria-labelledby="enrolled-classes-heading">
        <Card>
          <CardHeader>
            <CardTitle id="enrolled-classes-heading">My Classes</CardTitle>
            <CardDescription>
              Classes you are currently enrolled in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classesList.length === 0 ? (
              <p className="text-sm text-gray-500">
                You are not enrolled in any classes yet. Browse available classes to get started!
              </p>
            ) : (
              <div className="space-y-4">
                {classesList.map((enrollment) => {
                  const classData = enrollment.classes as any
                  return (
                    <article key={enrollment.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <h3 className="font-medium text-gray-900">{classData.name}</h3>
                      {classData.description && (
                        <p className="mt-1 text-sm text-gray-600">{classData.description}</p>
                      )}
                      <time className="mt-1 block text-xs text-gray-500" dateTime={enrollment.enrolled_at}>
                        Enrolled {formatDate(enrollment.enrolled_at)}
                      </time>
                    </article>
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

