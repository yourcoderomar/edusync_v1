import type { Metadata } from 'next'
import Link from 'next/link'
import { getMyEnrollmentRequests, getAvailableClasses } from '@/lib/actions/enrollment/get-enrollment-requests'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RequestEnrollmentButton } from '@/components/enrollment/RequestEnrollmentButton'
import { formatDate } from '@/lib/utils/format'
import { Clock, FileText, Plus, BookOpen } from 'lucide-react'

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

type AvailableClass = {
  id: string
  name: string
  description: string | null
  creator?: {
    full_name: string | null
  } | null
}

export const metadata: Metadata = {
  title: 'Enrollment Requests',
  description: 'View your enrollment requests and request to join new classes',
}

/**
 * Student enrollment requests page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function StudentEnrollmentRequestsPage() {
  const [requestsResult, availableClassesResult] = await Promise.all([
    getMyEnrollmentRequests(),
    getAvailableClasses(),
  ])

  const requests = (requestsResult.success ? requestsResult.data ?? [] : []) as EnrollmentRequest[]
  const availableClasses = (availableClassesResult.success ? availableClassesResult.data ?? [] : []) as AvailableClass[]

  const pendingRequests = requests.filter((request) => request.status === 'pending')
  const processedRequests = requests.filter((request) => request.status !== 'pending')

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enrollment Requests</h1>
        <p className="mt-2 text-gray-600">
          Request to join classes and track your enrollment status
        </p>
      </header>

      {/* Available Classes */}
      {availableClasses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <Plus className="inline h-5 w-5 mr-2" />
            Request Enrollment
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableClasses.map((classData) => {
              const creator = classData.creator

              return (
                <Card key={classData.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span className="line-clamp-1">{classData.name}</span>
                    </CardTitle>
                    {classData.description && (
                      <CardDescription className="line-clamp-2">
                        {classData.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {creator && (
                      <p className="text-sm text-gray-500">
                        Instructor: {creator.full_name}
                      </p>
                    )}
                    
                    <RequestEnrollmentButton classId={classData.id} className="w-full" />
                  </CardContent>
                </Card>
              )
            })}
          </div>
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
                              <Link href={`/student/classes`}>
                                View My Classes
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
      {(requests?.length ?? 0) === 0 && (availableClasses?.length ?? 0) === 0 && (
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
