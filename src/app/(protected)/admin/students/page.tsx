import type { Metadata } from 'next'
import { getStudents } from '@/lib/actions/students/get-students'
import { Card, CardContent } from '@/components/ui/card'
import { StudentList } from '@/components/students/StudentList'

export const metadata: Metadata = {
  title: 'Students',
  description: 'View and manage all students in your platform.',
}

/**
 * Students management page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function AdminStudentsPage() {
  const result = await getStudents()

  return (
    <>
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="mt-2 text-gray-600">
              View and manage all students in the platform
            </p>
          </div>
          {result.success && result.data && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{result.data.length}</p>
            </div>
          )}
        </div>
      </header>

      {!result.success ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-600">{result.error}</p>
          </CardContent>
        </Card>
      ) : (
        <StudentList students={result.data || []} />
      )}
    </>
  )
}

