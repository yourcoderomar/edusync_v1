import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { getStudentsByClass } from '@/lib/actions/students/get-students'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'

type EnrollmentWithStudent = {
  user_id: string
  enrolled_at: string
  student: {
    id: string
    full_name: string | null
    profile_picture_url: string | null
    phone: string | null
  } | null
}

interface ClassStudentsPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: ClassStudentsPageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)
  
  if (!result.success || !result.data) {
    return {
      title: 'Class Not Found',
    }
  }

  return {
    title: `Students - ${result.data.name}`,
    description: `View students enrolled in ${result.data.name}`,
  }
}

/**
 * Class students page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function ClassStudentsPage({ params }: ClassStudentsPageProps) {
  const { classId } = await params
  
  // Fetch class and students in parallel
  const [classResult, studentsResult] = await Promise.all([
    getClassById(classId),
    getStudentsByClass(classId),
  ])

  if (!classResult.success || !classResult.data) {
    notFound()
  }

  const classData = classResult.data
  const enrollments = (studentsResult.success && studentsResult.data ? studentsResult.data : []) as EnrollmentWithStudent[]

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="mt-2 text-gray-600">
              {classData.name}
            </p>
            {enrollments.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {enrollments.length} student{enrollments.length !== 1 ? 's' : ''} enrolled
              </p>
            )}
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/classes/${classId}`}>Back to class</Link>
          </Button>
        </div>
      </header>

      <section aria-labelledby="students-heading">
        <h2 id="students-heading" className="sr-only">
          Enrolled students
        </h2>

        {!studentsResult.success ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-red-600">{studentsResult.error}</p>
            </CardContent>
          </Card>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No students enrolled yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const student = enrollment.student
              if (!student) return null

              return (
                <Card key={enrollment.user_id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <Link href={`/admin/students/${student.id}`}>
                      <div className="flex flex-col items-center text-center space-y-4 cursor-pointer hover:opacity-80 transition-opacity">
                        {/* Student Image */}
                        <div className="flex-shrink-0">
                          {student.profile_picture_url ? (
                            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200">
                              <Image
                                src={student.profile_picture_url}
                                alt={student.full_name || 'Student'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-200">
                              <span className="text-blue-600 font-bold text-2xl">
                                {(student.full_name || 'S').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Student Info */}
                        <div className="w-full">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {student.full_name || 'Unknown Student'}
                          </h3>
                          {student.phone && (
                            <p className="text-sm text-gray-500 mt-1">{student.phone}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Enrolled {formatDate(enrollment.enrolled_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

