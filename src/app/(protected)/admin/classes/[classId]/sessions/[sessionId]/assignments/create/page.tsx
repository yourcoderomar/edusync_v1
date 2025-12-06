import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { AssignmentModeForm } from '@/components/assignments/AssignmentModeForm'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/format'

interface CreateAssignmentPageProps {
  params: Promise<{ classId: string; sessionId: string }>
}

export async function generateMetadata({
  params,
}: CreateAssignmentPageProps): Promise<Metadata> {
  const { sessionId } = await params
  const result = await getSessionById(sessionId)

  if (!result.success || !result.data) {
    return {
      title: 'Session Not Found',
    }
  }

  const session = result.data as any
  const classData = session.classes as any

  return {
    title: `Create Assignment - ${formatDate(session.session_date)}`,
    description: `Create a new assignment for ${
      classData?.name || 'class'
    } session`,
  }
}

/**
 * Create assignment page
 *
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side rendered with admin/instructor protection via RLS
 */
export default async function CreateAssignmentPage({
  params,
}: CreateAssignmentPageProps) {
  const { classId, sessionId } = await params
  const result = await getSessionById(sessionId)

  if (!result.success || !result.data) {
    notFound()
  }

  const session = result.data as any
  const classData = session.classes as any

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Assignment
            </h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'} -{' '}
              {formatDate(session.session_date)}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link
              href={`/admin/classes/${classId}/sessions/${sessionId}/assignments`}
            >
              Back to assignments
            </Link>
          </Button>
        </div>
      </header>

      <AssignmentModeForm sessionId={sessionId} classId={classId} />
    </>
  )
}






