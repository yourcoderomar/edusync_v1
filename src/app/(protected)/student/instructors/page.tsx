import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnrollWithInstructorButton } from '@/components/instructors/EnrollWithInstructorButton'

export const metadata: Metadata = {
  title: 'Instructors',
  description: 'Browse all instructors and see who you are enrolled with.',
}

type InstructorProfile = {
  id: string
  full_name: string | null
  phone: string | null
}

type InstructorEnrollmentWithProfile = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  instructor: InstructorProfile | null
}

export default async function StudentInstructorsPage() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) {
    return null
  }

  // Get current instructor enrollments for this student
  const { data: instructorEnrollments } = await supabase
    .from('instructor_enrollments')
    .select(
      `
        id,
        status,
        created_at,
        instructor:profiles!instructor_enrollments_instructor_id_fkey (
          id
        )
      `
    )
    .eq('student_id', user.id)

  const typedEnrollments = (instructorEnrollments || []) as InstructorEnrollmentWithProfile[]

  // Map instructorId -> status for quick lookup
  const enrollmentByInstructorId = new Map<string, InstructorEnrollmentWithProfile>()
  for (const enrollment of typedEnrollments) {
    if (enrollment.instructor?.id) {
      enrollmentByInstructorId.set(enrollment.instructor.id, enrollment)
    }
  }

  // Get all instructors (directory)
  const { data: instructors } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('role', 'instructor')
    .order('full_name', { ascending: true })

  const typedInstructors = (instructors || []) as InstructorProfile[]

  return (
    <>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">Instructors</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          Browse all instructors. You can enroll with any instructor from this page.
        </p>
      </header>

      {typedInstructors.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 text-center py-8">
              No instructors are available yet. Please check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {typedInstructors.map((instructor) => {
            const enrollment = enrollmentByInstructorId.get(instructor.id)
            const isEnrolled = enrollment?.status === 'approved'
            const initials = (instructor.full_name || 'U')
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <Card
                key={instructor.id}
                className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-1">
                          <Link
                            href={`/student/instructors/${instructor.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {instructor.full_name || 'Unnamed Instructor'}
                          </Link>
                        </CardTitle>
                        {instructor.phone && (
                          <p className="text-sm text-gray-600 mt-1">
                            {instructor.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">
                      {enrollment ? enrollment.status : 'not enrolled'}
                    </span>
                    {isEnrolled ? (
                      <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                        Enrolled
                      </span>
                    ) : (
                      <EnrollWithInstructorButton instructorId={instructor.id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}


