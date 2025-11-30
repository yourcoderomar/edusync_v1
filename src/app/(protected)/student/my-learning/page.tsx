import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
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

type InstructorData = {
  id: string
  full_name: string | null
  profile_picture_url: string | null
}

type ClassData = {
  id: string
  name: string
  description: string | null
  created_at: string
  teacher_id: string
}

type EnrollmentWithClass = Enrollment & {
  classes: (ClassData & { instructor: InstructorData | null }) | null
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
      .select(`
        id, 
        name, 
        description, 
        created_at,
        teacher_id,
        instructor:profiles!classes_teacher_id_fkey(id, full_name, profile_picture_url)
      `)
      .in('id', classIds)

    if (classesError) {
      console.error('Error fetching classes for My Learning:', classesError)
    }

    const classesList = (classes || []) as Array<ClassData & { instructor: InstructorData | null }>
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

      {classesList.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-sm text-gray-500 mb-4">
              You don&apos;t have any classes in your learning list yet. Enroll with an instructor and request to
              join their classes to get started.
            </p>
            <Button asChild>
              <Link href="/student/instructors">Browse Instructors</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classesList.map((enrollment) => {
            const classData = enrollment.classes
            if (!classData || !classData.id) return null

            const instructor = classData.instructor
            const initials = instructor?.full_name
              ? instructor.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'I'

            return (
              <Card
                key={`${enrollment.class_id}-${enrollment.user_id}`}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <Link href={`/student/classes/${classData.id}`}>
                  <CardHeader>
                    <div className="flex items-start gap-3 mb-3">
                      {instructor?.profile_picture_url ? (
                        <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={instructor.profile_picture_url}
                            alt={`${instructor.full_name || 'Instructor'}'s profile picture`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">{initials}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="line-clamp-2">{classData.name}</CardTitle>
                        {instructor?.full_name && (
                          <p className="text-sm text-gray-500 mt-1">by {instructor.full_name}</p>
                        )}
                      </div>
                    </div>
                    {classData.description && (
                      <CardDescription className="line-clamp-3">
                        {classData.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-gray-500">
                      <time dateTime={enrollment.enrolled_at}>
                        Enrolled {formatDate(enrollment.enrolled_at)}
                      </time>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      Open Class
                    </Button>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}






