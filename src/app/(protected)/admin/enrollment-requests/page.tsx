import type { Metadata } from 'next'
import Image from 'next/image'
import { getAllEnrollmentRequests } from '@/lib/actions/enrollment/get-enrollment-requests'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EnrollmentRequestActions } from '@/components/enrollment/EnrollmentRequestActions'
import { formatDate } from '@/lib/utils/format'
import { User, Clock, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Enrollment Requests - Admin',
  description: 'Manage student enrollment requests',
}

/**
 * Admin enrollment requests page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function AdminEnrollmentRequestsPage() {
  const result = await getAllEnrollmentRequests()
  const requests = result.success ? (result.data ?? []) : []

  const pendingRequests = requests.filter((r: any) => r.status === 'pending')
  const processedRequests = requests.filter((r: any) => r.status !== 'pending')

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enrollment Requests</h1>
        <p className="mt-2 text-gray-600">
          Review and manage student enrollment requests
        </p>
      </header>

      {/* Pending Requests */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Pending Requests ({pendingRequests.length})
        </h2>
        
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-600">No pending enrollment requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request: any) => {
              const student = request.student
              const classData = request.class

              return (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Student Info */}
                        <div className="flex-shrink-0">
                          {student?.profile_picture_url ? (
                            <div className="relative h-12 w-12 rounded-full overflow-hidden">
                              <Image
                                src={student.profile_picture_url}
                                alt={`${student.full_name || 'Student'}'s profile picture`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {student?.full_name || 'Unknown Student'}
                          </h3>
                          {student?.phone && (
                            <p className="text-sm text-gray-500">{student.phone}</p>
                          )}
                          
                          <div className="mt-3">
                            <p className="text-sm text-gray-500">Requesting enrollment in:</p>
                            <p className="font-medium text-gray-900">{classData?.name || 'Unknown Class'}</p>
                            {classData?.description && (
                              <p className="text-sm text-gray-600 mt-1">{classData.description}</p>
                            )}
                          </div>

                          {request.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-500 font-medium mb-1">Student Notes:</p>
                              <p className="text-sm text-gray-700">{request.notes}</p>
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>Requested {formatDate(request.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <EnrollmentRequestActions requestId={request.id} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Processed Requests ({processedRequests.length})
          </h2>
          
          <div className="space-y-4">
            {processedRequests.map((request: any) => {
              const student = request.student
              const classData = request.class
              const reviewer = request.reviewer

              return (
                <Card key={request.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0">
                          {student?.profile_picture_url ? (
                            <div className="relative h-12 w-12 rounded-full overflow-hidden">
                              <Image
                                src={student.profile_picture_url}
                                alt={`${student.full_name || 'Student'}'s profile picture`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {student?.full_name || 'Unknown Student'}
                            </h3>
                            <Badge variant={request.status === 'approved' ? 'default' : 'destructive'}>
                              {request.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1">
                            {classData?.name || 'Unknown Class'}
                          </p>

                          <div className="mt-2 text-sm text-gray-500">
                            <p>Reviewed by {reviewer?.full_name || 'Unknown'}</p>
                            <p>{formatDate(request.reviewed_at)}</p>
                          </div>
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
    </>
  )
}
