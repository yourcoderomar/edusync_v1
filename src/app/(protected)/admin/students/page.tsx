import type { Metadata } from 'next'
import { getStudentsWithEnrollments } from '@/lib/actions/students/get-students'
import { getClasses } from '@/lib/actions/classes/get-classes'
import { Card, CardContent } from '@/components/ui/card'
import { StudentsPageClient } from '@/components/students/StudentsPageClient'

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
  const [studentsResult, classesResult] = await Promise.all([
    getStudentsWithEnrollments(),
    getClasses(),
  ])

  const students = studentsResult.success && studentsResult.data ? studentsResult.data : []
  const classes = classesResult.success && classesResult.data ? classesResult.data : []

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
          {studentsResult.success && students.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{students.length}</p>
            </div>
          )}
        </div>
      </header>

      {!studentsResult.success ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-600">{studentsResult.error}</p>
          </CardContent>
        </Card>
      ) : (
        <StudentsPageClient 
          initialStudents={students as any} 
          classes={(classes as any[]).map(c => ({ id: c.id, name: c.name }))}
        />
      )}
    </>
  )
}

