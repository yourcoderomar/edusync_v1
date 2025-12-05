import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAssignmentById } from '@/lib/actions/assignments/get-assignments'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AssignmentEditForm } from '@/components/assignments/AssignmentEditForm'
import { formatDate } from '@/lib/utils/format'

interface AdminAssignmentEditPageProps {
  params: Promise<{ classId: string; sessionId: string; assignmentId: string }>
}

export async function generateMetadata({
  params,
}: AdminAssignmentEditPageProps): Promise<Metadata> {
  const { assignmentId } = await params
  const result = await getAssignmentById(assignmentId)

  if (!result.success || !result.data) {
    return {
      title: 'Assignment Not Found',
    }
  }

  const assignment = result.data as any
  return {
    title: `Edit Assignment - ${assignment.title}`,
    description: 'Edit assignment details',
  }
}

/**
 * Admin/instructor assignment edit page
 */
export default async function AdminAssignmentEditPage({
  params,
}: AdminAssignmentEditPageProps) {
  const { classId, sessionId, assignmentId } = await params
  const [assignmentResult, sessionResult] = await Promise.all([
    getAssignmentById(assignmentId),
    getSessionById(sessionId),
  ])

  if (!assignmentResult.success || !assignmentResult.data) {
    notFound()
  }

  if (!sessionResult.success || !sessionResult.data) {
    notFound()
  }

  const assignment = assignmentResult.data as any
  const session = sessionResult.data as any
  const classData = session.classes as any

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Assignment
            </h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'} -{' '}
              {formatDate(session.session_date)}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link
              href={`/admin/classes/${classId}/sessions/${sessionId}/assignments/${assignmentId}`}
            >
              Back to details
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>Update the basic details of this assignment.</CardDescription>
        </CardHeader>
        <CardContent>
          <AssignmentEditForm
            assignmentId={assignment.id}
            classId={classId}
            sessionId={sessionId}
            initialTitle={assignment.title}
            initialInstructions={assignment.instructions}
            initialDueAt={assignment.due_at}
            initialMaxPoints={assignment.max_points}
          />
        </CardContent>
      </Card>
    </>
  )
}




