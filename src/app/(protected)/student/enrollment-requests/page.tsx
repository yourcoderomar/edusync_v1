import type { Metadata } from 'next'
import Link from 'next/link'
import { getMyEnrollmentRequests } from '@/lib/actions/enrollment/get-enrollment-requests'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RequestEnrollmentButton } from '@/components/enrollment/RequestEnrollmentButton'
import { EnrollWithInstructorButton } from '@/components/instructors/EnrollWithInstructorButton'
import { formatDate } from '@/lib/utils/format'
import { Clock, FileText } from 'lucide-react'

type EnrollmentRequest = {
  id: string
  class_id: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  created_at: string
  reviewed_at: string | null
  class: {
    id: string
    name: string | null
    description: string | null
  } | null
  reviewer?: {
    full_name: string | null
  } | null
}

type InstructorProfile = {
  id: string
  full_name: string | null
  phone: string | null
}

export const metadata: Metadata = {
  title: 'Enrollment Requests',
  description: 'View your class enrollment requests and track their status',
}

/**
 * Student enrollment requests page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function StudentEnrollmentRequestsPage() {
  const [requestsResult, supabase, user] = await Promise.all([
    getMyEnrollmentRequests(),
    createClient(),
    getUser(),
  ])

  const requests = (requestsResult.success ? requestsResult.data ?? [] : []) as EnrollmentRequest[]

  // Compute instructors the student is not enrolled with (by approved instructor_enrollments)
  let availableInstructors: InstructorProfile[] = []

  if (user) {
    const { data: instructorEnrollments } = await supabase
      .from('instructor_enrollments')
      .select(
        `
          id,
          status,
          instructor_id,
          instructor:profiles!instructor_enrollments_instructor_id_fkey (
            id
          )
        `
      )
      .eq('student_id', user.id)

    const approvedInstructorIds = new Set(
      (instructorEnrollments || [])
        .filter((e: any) => e.status === 'approved' && e.instructor?.id)
        .map((e: any) => e.instructor.id as string)
    )

    const { data: instructors } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'instructor')
      .order('full_name', { ascending: true })

    const typedInstructors = (instructors || []) as InstructorProfile[]
    availableInstructors = typedInstructors.filter((instr) => !approvedInstructorIds.has(instr.id))
  }

  const pendingRequests = requests.filter((request) => request.status === 'pending')
  const processedRequests = requests.filter((request) => request.status !== 'pending')

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enrollment Requests</h1>
        <p className="mt-2 text-gray-600">
          Manage your requests to enroll with instructors and join their classes.
          First enroll with an instructor, then request to join their classes.
        </p>
      </header>

      {/* Instructors the student is not enrolled with */}
      {user && (
        <section className="mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Instructors you&apos;re not enrolled with</CardTitle>
              <CardDescription>
                Choose an instructor to enroll with. After that, you can request to join their classes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableInstructors.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You are already enrolled with all available instructors, or no instructors are available yet.
                </p>
              ) : (
                <ul className="space-y-4">
                  {availableInstructors.map((instructor) => (
                    <li
                      key={instructor.id}
                      className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {instructor.full_name || 'Unnamed Instructor'}
                        </p>
                        {instructor.phone && (
                          <p className="mt-1 text-sm text-gray-600">
                            Phone: {instructor.phone}
                          </p>
                        )}
                      </div>
                      <EnrollWithInstructorButton instructorId={instructor.id} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Requests ({pendingRequests.length})
          </h2>
          
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const classData = request.class

              return (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {classData?.name || 'Unknown Class'}
                          </h3>
                          <Badge variant="warning">Pending</Badge>
                        </div>
                        
                        {classData?.description && (
                          <p className="text-gray-600 mb-3">{classData.description}</p>
                        )}

                        {request.notes && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 font-medium mb-1">Your Notes:</p>
                            <p className="text-sm text-gray-700">{request.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Requested {formatDate(request.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Request History ({processedRequests.length})
          </h2>
          
          <div className="space-y-4">
            {processedRequests.map((request) => {
              const classData = request.class
              const reviewer = request.reviewer

              return (
                <Card key={request.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {classData?.name || 'Unknown Class'}
                          </h3>
                          <Badge variant={request.status === 'approved' ? 'success' : 'destructive'}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        {classData?.description && (
                          <p className="text-gray-600 mb-3">{classData.description}</p>
                        )}

                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Reviewed by {reviewer?.full_name || 'Admin'}</p>
                          <p>
                            {request.reviewed_at ? formatDate(request.reviewed_at) : 'Pending review'}
                          </p>
                        </div>

                        <div className="mt-4 flex gap-2">
                          {request.status === 'approved' && (
                            <Button asChild size="sm">
                              <Link href={`/student/instructors`}>
                                View My Instructors
                              </Link>
                            </Button>
                          )}
                          
                          {request.status === 'rejected' && (
                            <RequestEnrollmentButton 
                              classId={request.class_id} 
                              className="w-auto"
                              isReapplying={true}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(requests?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No enrollment requests</h2>
            <p className="text-gray-600 text-center max-w-md">
              You haven&apos;t made any enrollment requests yet. Available classes will appear here when they are created.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
