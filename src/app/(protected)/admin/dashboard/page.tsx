import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'View and manage your classes, students, and educational activities.',
}

/**
 * Admin dashboard page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch dashboard statistics
  const [classesResult, studentsResult, enrollmentRequestsResult] = await Promise.all([
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('enrollment_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const stats = [
    {
      title: 'Total Classes',
      value: classesResult.count || 0,
      description: 'Active classes you manage',
    },
    {
      title: 'Total Students',
      value: studentsResult.count || 0,
      description: 'Registered students',
    },
    {
      title: 'Pending Requests',
      value: enrollmentRequestsResult.count || 0,
      description: 'Enrollment requests awaiting approval',
    },
  ]

  // Fetch recent classes
  const { data: recentClasses } = await supabase
    .from('classes')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here&apos;s an overview of your educational platform.
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

      <section aria-labelledby="recent-classes-heading">
        <Card>
          <CardHeader>
            <CardTitle id="recent-classes-heading">Recent Classes</CardTitle>
            <CardDescription>
              Your recently created classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!recentClasses || recentClasses.length === 0 ? (
              <p className="text-sm text-gray-500">No classes yet. Create your first class to get started!</p>
            ) : (
              <div className="space-y-4">
                {recentClasses.map((classItem) => (
                  <article key={classItem.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-medium text-gray-900">{classItem.name}</h3>
                    {classItem.description && (
                      <p className="mt-1 text-sm text-gray-600">{classItem.description}</p>
                    )}
                    <time className="mt-1 block text-xs text-gray-500" dateTime={classItem.created_at}>
                      Created {formatDate(classItem.created_at)}
                    </time>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}

