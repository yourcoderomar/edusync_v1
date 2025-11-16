import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'

interface ClassDetailsPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: ClassDetailsPageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)
  
  if (!result.success) {
    return {
      title: 'Class Not Found',
    }
  }

  // Type assertion: when success is true, data exists
  const classData = (result as { success: true; data: { name: string; description: string | null } }).data

  return {
    title: classData.name,
    description: classData.description || `View details and manage ${classData.name}`,
  }
}

/**
 * Class details page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function ClassDetailsPage({ params }: ClassDetailsPageProps) {
  const { classId } = await params
  const result = await getClassById(classId)

  if (!result.success || !result.data) {
    notFound()
  }

  const classData = result.data
  const creator = classData.creator as any

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
            <p className="mt-2 text-gray-600">
              {classData.description || 'No description provided'}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created by:</span> {creator?.full_name || 'Unknown'}
              </div>
              <div>
                <time dateTime={classData.created_at}>
                  Created {formatDate(classData.created_at)}
                </time>
              </div>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/classes">Back to classes</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>Manage class sessions and content</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/admin/classes/${classId}/sessions`}>View sessions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>View enrolled students</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/admin/classes/${classId}/students`}>View students</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Track student attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/admin/classes/${classId}/attendance`}>View attendance</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quizzes</CardTitle>
            <CardDescription>Create and manage quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/admin/classes/${classId}/quizzes`}>View quizzes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

