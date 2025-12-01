import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, getUserProfile } from '@/lib/supabase/server'
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
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' }

  // Instructors now use the dedicated instructor dashboard
  if (typedProfile.role === 'instructor') {
    redirect('/instructor/dashboard')
  }

  const isAdminUser = typedProfile.role === 'admin'

  let stats: Array<{ title: string; value: number; description: string }> = []
  let classesList: Array<{ id: string; name: string; description: string | null; created_at: string }> = []

  if (isAdminUser) {
    const [classesResult, studentsResult, enrollmentRequestsResult, recentClassesResult] = await Promise.all([
      supabase.from('classes').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('enrollment_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('classes')
        .select('id, name, description, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    stats = [
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

    classesList = (recentClassesResult.data || []) as Array<{ id: string; name: string; description: string | null; created_at: string }>
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">Admin Dashboard</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
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
            {classesList.length === 0 ? (
              <p className="text-sm text-gray-500">No classes yet. Create your first class to get started!</p>
            ) : (
              <div className="space-y-4">
                {classesList.map((classItem) => (
                  <article 
                    key={classItem.id} 
                    className="border-b border-gray-200 pb-4 last:border-0 last:pb-0 hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                    {classItem.description && (
                      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{classItem.description}</p>
                    )}
                    <time className="mt-2 block text-xs text-gray-500" dateTime={classItem.created_at}>
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

