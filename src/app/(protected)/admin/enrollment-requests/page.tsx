import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Enrollment Requests',
  description: 'Review and manage student enrollment requests.',
}

/**
 * Enrollment requests page
 * 
 * @todo Implement enrollment request approval/rejection workflow
 * @validation Schema ready at lib/validations/enrollment.schema.ts
 * @actions Implement in lib/actions/enrollments/
 */
export default function AdminEnrollmentRequestsPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enrollment Requests</h1>
        <p className="mt-2 text-gray-600">
          Review and manage pending enrollment requests
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            This feature is ready to be implemented
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ Validation schemas created: <code className="bg-gray-100 px-2 py-1 rounded">lib/validations/enrollment.schema.ts</code></p>
            <p>📁 Server actions structure: <code className="bg-gray-100 px-2 py-1 rounded">lib/actions/enrollments/</code></p>
            <p>🎯 Next steps: Implement server actions and UI components</p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

