import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'My Learning',
  description: 'View all the classes you are currently enrolled in.',
}

type Enrollment = {
  class_id: string
  user_id: string
  enrolled_at: string
}

type ClassData = {
  id: string
  name: string
  description: string | null
  created_at: string
}

type EnrollmentWithClass = Enrollment & {
  classes: ClassData | null
}

/**
 * Student "My Learning" page
 *
 * Shows all classes the student is enrolled in.
 */
export default async function MyLearningPage() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) {
    return null
  }

  // Fetch all enrolled classes for this student
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('class_id, user_id, enrolled_at')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })

  if (enrollmentsError) {
    console.error('Error fetching enrollments for My Learning:', enrollmentsError)
  }

  let enrolledClasses: EnrollmentWithClass[] = []

  if (enrollments && enrollments.length > 0) {
    const enrollmentsList = enrollments as Enrollment[]
    const classIds = enrollmentsList.map((e) => e.class_id)

    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name, description, created_at')
      .in('id', classIds)

    if (classesError) {
      console.error('Error fetching classes for My Learning:', classesError)
    }

    const classesList = (classes || []) as ClassData[]
    const classesMap = new Map(classesList.map((c) => [c.id, c]))

    enrolledClasses = enrollmentsList.map((enrollment) => ({
      ...enrollment,
      classes: classesMap.get(enrollment.class_id) || null,
    }))
  }

  const classesList = enrolledClasses

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
        <p className="mt-2 text-gray-600">
          All the classes you are currently enrolled in. Open a class to view sessions, quizzes, and details.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Classes</CardTitle>
          <CardDescription>
            {classesList.length === 0
              ? 'You are not enrolled in any classes yet.'
              : `${classesList.length} class${classesList.length !== 1 ? 'es' : ''} in your learning list`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classesList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-4">
                You don&apos;t have any classes in your learning list yet. Enroll with an instructor and request to
                join their classes to get started.
              </p>
              <Button asChild>
                <Link href="/student/enrollment-requests">Go to Enrollment Requests</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {classesList.map((enrollment) => {
                const classData = enrollment.classes
                if (!classData || !classData.id) return null

                return (
                  <article
                    key={`${enrollment.class_id}-${enrollment.user_id}`}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link href={`/student/classes/${classData.id}`} className="flex-1">
                        <h2 className="font-semibold text-lg text-gray-900">{classData.name}</h2>
                        {classData.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{classData.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <time dateTime={enrollment.enrolled_at}>
                            Enrolled {formatDate(enrollment.enrolled_at)}
                          </time>
                        </div>
                      </Link>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/student/classes/${classData.id}`}>Open Class</Link>
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}


