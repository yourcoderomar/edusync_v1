import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'My Enrollment Requests',
  description: 'View the status of your enrollment requests.',
}

/**
 * Student enrollment requests page
 * 
 * @todo Implement enrollment request submission and status viewing
 */
export default function StudentEnrollmentRequestsPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enrollment Requests</h1>
        <p className="mt-2 text-gray-600">
          Submit and track your enrollment requests
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <CardDescription>
            This feature is ready to be implemented
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Implement UI to submit new requests and view status of existing requests.
          </p>
        </CardContent>
      </Card>
    </>
  )
}

