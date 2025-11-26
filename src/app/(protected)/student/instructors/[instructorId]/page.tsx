import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { RequestEnrollmentButton } from '@/components/enrollment/RequestEnrollmentButton'
import { EnrollWithInstructorButton } from '@/components/instructors/EnrollWithInstructorButton'

interface InstructorClassesPageProps {
  params: Promise<{ instructorId: string }>
}

export async function generateMetadata({ params }: InstructorClassesPageProps): Promise<Metadata> {
  const { instructorId } = await params
  const supabase = await createClient()

  const { data: instructor } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', instructorId)
    .eq('role', 'instructor')
    .single()

  const name = (instructor as { full_name: string | null } | null)?.full_name || 'Instructor'

  return {
    title: `${name} - Classes`,
    description: `View classes taught by ${name}`,
  }
}

export default async function InstructorClassesPage({ params }: InstructorClassesPageProps) {
  const { instructorId } = await params
  const supabase = await createClient()
  const user = await getUser()

  if (!user) {
    notFound()
  }

  // Get instructor profile
  const { data: instructor, error: instructorError } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('id', instructorId)
    .eq('role', 'instructor')
    .single()

  if (instructorError || !instructor) {
    notFound()
  }

  // Check current enrollment status with this instructor (if any)
  const { data: instructorEnrollment } = await supabase
    .from('instructor_enrollments')
    .select('id, status')
    .eq('student_id', user.id)
    .eq('instructor_id', instructorId)
    .maybeSingle()

  // Get all classes taught by this instructor
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, name, description, created_at')
    .eq('teacher_id', instructorId)
    .order('created_at', { ascending: false })

  if (classesError) {
    console.error('Error fetching instructor classes:', classesError)
  }

  const typedClasses = (classes || []) as Array<{
    id: string
    name: string
    description: string | null
    created_at: string
  }>

  // Determine which of these classes the student is enrolled in
  const classIds = typedClasses.map((c) => c.id)
  let enrolledClassIds = new Set<string>()

  if (classIds.length > 0) {
    const { data: classEnrollments } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('user_id', user.id)
      .in('class_id', classIds)

    enrolledClassIds = new Set(
      (classEnrollments || []).map((e) => (e as { class_id: string }).class_id)
    )
  }

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {instructor.full_name || 'Instructor'}
            </h1>
            {instructor.phone && (
              <p className="mt-2 text-gray-600">
                Phone: {instructor.phone}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Classes taught by this instructor
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {instructorEnrollment?.status === 'approved' ? (
              <span className="text-xs font-semibold text-green-600">
                Enrolled with this instructor
              </span>
            ) : (
              <EnrollWithInstructorButton instructorId={instructor.id} />
            )}
            <Link
              href="/student/instructors"
              className="text-sm text-blue-600 hover:underline"
            >
              Back to Instructors
            </Link>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
          <CardDescription>
            {typedClasses.length === 0
              ? 'This instructor has no classes yet.'
              : `${typedClasses.length} class${typedClasses.length !== 1 ? 'es' : ''} taught by this instructor`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {typedClasses.length === 0 ? (
            <p className="text-sm text-gray-500">
              There are no classes to show for this instructor yet.
            </p>
          ) : (
            <div className="space-y-4">
              {typedClasses.map((cls) => {
                const isEnrolled = enrolledClassIds.has(cls.id)

                return (
                  <article
                    key={cls.id}
                    className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="space-y-2">
                      <h2 className="font-semibold text-lg text-gray-900">
                        {cls.name}
                      </h2>
                      {cls.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {cls.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Created {formatDate(cls.created_at)}
                      </p>
                      <p className="mt-1 text-xs font-medium">
                        {isEnrolled ? (
                          <span className="text-green-600">You are enrolled in this class</span>
                        ) : (
                          <span className="text-gray-500">You are not enrolled in this class</span>
                        )}
                      </p>
                      {!isEnrolled && (
                        <div className="mt-2">
                          <RequestEnrollmentButton classId={cls.id} className="w-full sm:w-auto" />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {isEnrolled && (
                        <Link
                          href={`/student/classes/${cls.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View class details
                        </Link>
                      )}
                      {!isEnrolled && (
                        <p className="text-[11px] text-gray-400 max-w-[180px] text-right">
                          Submit a request to join this class. You can track its status on the Enrollment Requests page.
                        </p>
                      )}
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


