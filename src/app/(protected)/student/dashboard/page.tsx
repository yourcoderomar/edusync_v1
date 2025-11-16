import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      .select('class_id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .not('score', 'is', null),
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

  // Fetch enrolled classes with class details in parallel
  type Enrollment = {
    class_id: string
    user_id: string
    enrolled_at: string
  }

  type ClassData = {
    id: string
    name: string
    description: string | null
  }

  type EnrollmentWithClass = Enrollment & {
    classes: ClassData | null
  }

  // Fetch enrollments first to get class IDs
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('class_id, user_id, enrolled_at')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(5)
  
  if (enrollmentsError) {
    console.error('Error fetching enrollments:', enrollmentsError)
  }

  let classesList: EnrollmentWithClass[] = []

  if (enrollments && enrollments.length > 0) {
    const enrollmentsList = enrollments as Enrollment[]
    const classIds = enrollmentsList.map(e => e.class_id)
    
    // Fetch classes in parallel (could be optimized further with a join, but RLS makes it complex)
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name, description')
      .in('id', classIds)

    if (classesError) {
      console.error('Error fetching classes:', classesError)
    }

    // Combine enrollments with class data
    const classesListData = (classes || []) as ClassData[]
    const classesMap = new Map(classesListData.map(c => [c.id, c]))
    classesList = enrollmentsList.map(enrollment => ({
      ...enrollment,
      classes: classesMap.get(enrollment.class_id) || null
    }))
  }

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle id="enrolled-classes-heading">My Classes</CardTitle>
                <CardDescription>
                  Classes you are currently enrolled in
                </CardDescription>
              </div>
              {classesList.length > 0 && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/student/classes">View All</Link>
                </Button>
              )}
            </div>
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
                  if (!classData || !classData.id) return null
                  return (
                    <Link
                      key={`${enrollment.class_id}-${enrollment.user_id}`}
                      href={`/student/classes/${classData.id}`}
                      className="block"
                    >
                      <article className="border-b border-gray-200 pb-4 last:border-0 last:pb-0 hover:bg-gray-50 p-3 -m-3 rounded-lg transition-colors">
                        <h3 className="font-medium text-gray-900">{classData.name}</h3>
                        {classData.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{classData.description}</p>
                        )}
                        <time className="mt-1 block text-xs text-gray-500" dateTime={enrollment.enrolled_at}>
                          Enrolled {formatDate(enrollment.enrolled_at)}
                        </time>
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

