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
        <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
        <p className="mt-2 text-gray-600">
          Browse all instructors. You can enroll with any instructor from this page.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Instructors</CardTitle>
          <CardDescription>
            See all instructors and your enrollment status with each one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {typedInstructors.length === 0 ? (
            <p className="text-sm text-gray-500">
              No instructors are available yet. Please check back later.
            </p>
          ) : (
            <ul className="space-y-4">
              {typedInstructors.map((instructor) => {
                const enrollment = enrollmentByInstructorId.get(instructor.id)
                const isEnrolled = enrollment?.status === 'approved'

                return (
                  <li
                    key={instructor.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        <Link
                          href={`/student/instructors/${instructor.id}`}
                          className="hover:underline"
                        >
                          {instructor.full_name || 'Unnamed Instructor'}
                        </Link>
                      </p>
                      {instructor.phone && (
                        <p className="mt-1 text-sm text-gray-600">
                          Phone: {instructor.phone}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Status:{' '}
                        <span className="capitalize">
                          {enrollment ? enrollment.status : 'not enrolled'}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isEnrolled ? (
                        <span className="text-xs font-semibold text-green-600">
                          Enrolled
                        </span>
                      ) : (
                        <EnrollWithInstructorButton instructorId={instructor.id} />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}


