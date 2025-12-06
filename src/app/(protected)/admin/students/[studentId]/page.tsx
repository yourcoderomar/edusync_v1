import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getStudentById } from '@/lib/actions/students/get-students'
import { getClasses } from '@/lib/actions/classes/get-classes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'
import { AdminEnrollStudentForm } from '@/components/enrollment/AdminEnrollStudentForm'
import { RemoveStudentButton } from '@/components/enrollment/RemoveStudentButton'
import { UnenrollFromInstructorButton } from '@/components/enrollment/UnenrollFromInstructorButton'

/**
 * Derive quiz attempt status from data
 */
function getAttemptStatus(attempt: any): 'graded' | 'submitted' | 'in_progress' {
  if (!attempt.submitted_at) return 'in_progress'
  if (attempt.score !== null) return 'graded'
  return 'submitted'
}

interface StudentDetailsPageProps {
  params: Promise<{ studentId: string }>
}

export async function generateMetadata({ params }: StudentDetailsPageProps): Promise<Metadata> {
  const { studentId } = await params
  const result = await getStudentById(studentId)
  
  if (!result.success) {
    return {
      title: 'Student Not Found',
    }
  }

  // Type assertion: when success is true, data exists
  const studentData = (result as { success: true; data: { student: any } }).data
  const student = studentData.student

  return {
    title: student?.full_name || 'Student',
    description: `View details and performance for ${student?.full_name || 'student'}`,
  }
}

/**
 * Student details page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function StudentDetailsPage({ params }: StudentDetailsPageProps) {
  const { studentId } = await params
  const result = await getStudentById(studentId)
  const classesResult = await getClasses()

  if (!result.success) {
    notFound()
  }

  // Type assertion: when success is true, data exists
  const { student, enrollments, quizAttempts, instructorEnrollments } = (result as {
    success: true
    data: { student: any; enrollments: any[]; quizAttempts: any[]; instructorEnrollments: any[] }
  }).data

  const allClasses =
    classesResult && classesResult.success && classesResult.data ? classesResult.data : []

  const enrolledClassIds = new Set(
    (enrollments || []).map((enrollment: { class_id: string }) => enrollment.class_id)
  )

  const availableClasses = (allClasses as Array<{ id: string; name: string; description?: string | null }>).filter(
    (cls) => !enrolledClassIds.has(cls.id)
  )

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {student.profile_picture_url ? (
              <div className="relative h-20 w-20 rounded-full overflow-hidden">
                <Image
                  src={student.profile_picture_url}
                  alt={`${student.full_name || 'Student'}'s profile picture`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-2xl">
                  {(student.full_name || 'S').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {student.full_name || 'Unnamed Student'}
                </h1>
                {(student as any).is_guest && (
                  <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                    Guest Account
                  </span>
                )}
              </div>
              {student.phone && (
                <p className="mt-2 text-gray-600">
                  <span className="text-gray-500">Phone:</span> {student.phone}
                </p>
              )}
              {(student as any).parent_phone_number && (
                <p className="mt-1 text-gray-600">
                  <span className="text-gray-500">Parent Phone:</span> {(student as any).parent_phone_number}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                <time dateTime={student.created_at}>
                  {(student as any).is_guest ? 'Created' : 'Joined'} {formatDate(student.created_at)}
                </time>
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={(student as any).is_guest ? "/admin/guests" : "/admin/students"}>
              Back to {(student as any).is_guest ? "guests" : "students"}
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Enrolled Classes</p>
                <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {(student as any).is_guest ? 'Instructor Enrollments' : 'Quiz Attempts'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(student as any).is_guest ? instructorEnrollments.length : quizAttempts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!(student as any).is_guest && (
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {quizAttempts.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Completed Quizzes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {quizAttempts.filter((a: any) => getAttemptStatus(a) === 'graded').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const gradedAttempts = quizAttempts.filter((a: any) => getAttemptStatus(a) === 'graded' && a.score !== null)
                      if (gradedAttempts.length === 0) return 'N/A'
                      const avg = gradedAttempts.reduce((sum: number, a: any) => sum + a.score, 0) / gradedAttempts.length
                      return `${Math.round(avg)}%`
                    })()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No quiz data available</p>
            )}
          </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Enroll in class</CardTitle>
            <CardDescription>
              Enroll this {(student as any).is_guest ? 'guest account' : 'student'} into an additional class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminEnrollStudentForm
              studentId={student.id}
              availableClasses={availableClasses}
            />
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="enrollments-heading" className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle id="enrollments-heading">Enrolled Classes</CardTitle>
            <CardDescription>
              Classes this {(student as any).is_guest ? 'guest account' : 'student'} is currently enrolled in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="text-sm text-gray-500">Not enrolled in any classes yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment: any) => {
                    const classData = enrollment.classes
                    if (!classData) return null
                    
                    return (
                      <TableRow key={enrollment.class_id}>
                        <TableCell className="font-medium">{classData.name || 'Unknown Class'}</TableCell>
                        <TableCell className="text-gray-600">
                          {classData.description || 'No description'}
                        </TableCell>
                        <TableCell>
                          <time dateTime={enrollment.enrolled_at}>
                            {formatDate(enrollment.enrolled_at)}
                          </time>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/classes/${classData.id}`}>View Class</Link>
                            </Button>
                            <RemoveStudentButton
                              studentId={student.id}
                              classId={enrollment.class_id}
                              studentName={student.full_name || 'Student'}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {!(student as any).is_guest && (
      <section aria-labelledby="quizzes-heading">
        <Card>
          <CardHeader>
            <CardTitle id="quizzes-heading">Quiz Attempts</CardTitle>
            <CardDescription>
              Recent quiz attempts and scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quizAttempts.length === 0 ? (
              <p className="text-sm text-gray-500">No quiz attempts yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizAttempts.slice(0, 10).map((attempt: any) => {
                    const status = getAttemptStatus(attempt)
                    return (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <time dateTime={attempt.started_at}>
                            {formatDate(attempt.started_at)}
                          </time>
                        </TableCell>
                        <TableCell>
                          {attempt.submitted_at ? (
                            <time dateTime={attempt.submitted_at}>
                              {formatDate(attempt.submitted_at)}
                            </time>
                          ) : (
                            <span className="text-gray-400">Not submitted</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              status === 'graded'
                                ? 'bg-green-100 text-green-800'
                                : status === 'submitted'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {attempt.score !== null ? `${attempt.score}%` : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
      )}

      <section aria-labelledby="instructors-heading" className="mt-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle id="instructors-heading">Instructor Enrollments</CardTitle>
            <CardDescription>
              Instructors this {(student as any).is_guest ? 'guest account' : 'student'} is enrolled with
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!instructorEnrollments || instructorEnrollments.length === 0 ? (
              <p className="text-sm text-gray-500">Not enrolled with any instructors yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor Name</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructorEnrollments.map((enrollment: any) => {
                    const instructorData = enrollment.instructor
                    if (!instructorData) return null
                    
                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {instructorData.full_name || 'Unknown Instructor'}
                        </TableCell>
                        <TableCell>
                          <time dateTime={enrollment.created_at}>
                            {formatDate(enrollment.created_at)}
                          </time>
                        </TableCell>
                        <TableCell>
                          <UnenrollFromInstructorButton
                            studentId={student.id}
                            instructorId={enrollment.instructor_id}
                            instructorName={instructorData.full_name || 'Instructor'}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}

