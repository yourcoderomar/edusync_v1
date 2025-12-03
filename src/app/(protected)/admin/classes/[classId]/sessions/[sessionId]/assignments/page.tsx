import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { getAssignmentsBySession } from '@/lib/actions/assignments/get-assignments'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AssignmentActions } from '@/components/assignments/AssignmentActions'
import { formatDate } from '@/lib/utils/format'
import { FileText, Plus } from 'lucide-react'

interface AssignmentsPageProps {
  params: Promise<{ classId: string; sessionId: string }>
}

export async function generateMetadata({
  params,
}: AssignmentsPageProps): Promise<Metadata> {
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
    title: `Assignments - ${formatDate(session.session_date)}`,
    description: `Manage assignments for ${
      classData?.name || 'class'
    } session`,
  }
}

/**
 * Assignments list page for a session
 *
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function AssignmentsPage({ params }: AssignmentsPageProps) {
  const { classId, sessionId } = await params
  const [sessionResult, assignmentsResult] = await Promise.all([
    getSessionById(sessionId),
    getAssignmentsBySession(sessionId),
  ])

  if (!sessionResult.success || !sessionResult.data) {
    notFound()
  }

  const session = sessionResult.data as any
  const classData = session.classes as any
  const assignments = assignmentsResult.success ? assignmentsResult.data : []

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Session Assignments
            </h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'} -{' '}
              {formatDate(session.session_date)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link
                href={`/admin/classes/${classId}/sessions/${sessionId}/assignments/create`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create assignment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/classes/${classId}/sessions/${sessionId}`}>
                Back to session
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No assignments yet
            </h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Create your first assignment for this session to collect
              student work.
            </p>
            <Button asChild>
              <Link
                href={`/admin/classes/${classId}/sessions/${sessionId}/assignments/create`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create assignment
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment: any) => {
            const creator = assignment.creator as any
            return (
              <Card
                key={assignment.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="line-clamp-2">
                      {assignment.title}
                    </CardTitle>
                    {assignment.instructions && (
                      <CardDescription className="line-clamp-3 mt-1">
                        {assignment.instructions}
                      </CardDescription>
                    )}
                  </div>
                  <AssignmentActions
                    assignmentId={assignment.id}
                    classId={classId}
                    sessionId={sessionId}
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  {creator && (
                    <p className="text-sm text-gray-500">
                      Created by {creator.full_name}
                    </p>
                  )}
                  {assignment.due_at && (
                    <p className="text-sm text-gray-500">
                      Due {formatDate(assignment.due_at)}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {assignment.mode === 'freeform'
                        ? 'Freeform'
                        : assignment.mode === 'structured'
                        ? 'Structured'
                        : 'Bulk MCQ'}
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <Button
                      asChild
                      className="w-full"
                      size="sm"
                      variant="outline"
                    >
                      <Link
                        href={`/admin/classes/${classId}/sessions/${sessionId}/assignments/${assignment.id}`}
                      >
                        View details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}


