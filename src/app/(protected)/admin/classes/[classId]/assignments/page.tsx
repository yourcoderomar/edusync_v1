import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { getAssignmentsBySession } from '@/lib/actions/assignments/get-assignments'
import { getSessionsByClass } from '@/lib/actions/sessions/get-sessions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'

interface ClassAssignmentsPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({
  params,
}: ClassAssignmentsPageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)

  if (!result.success || !result.data) {
    return {
      title: 'Class Not Found',
    }
  }

  const classData = result.data

  return {
    title: `Assignments - ${classData.name}`,
    description: `View assignments for ${classData.name}`,
  }
}

/**
 * View all assignments for a class (grouped by session date).
 *
 * @security Server-side data fetching with RLS
 */
export default async function ClassAssignmentsPage({
  params,
}: ClassAssignmentsPageProps) {
  const { classId } = await params
  const classResult = await getClassById(classId)
  const sessionsResult = await getSessionsByClass(classId)

  if (!classResult.success || !classResult.data) {
    notFound()
  }

  if (!sessionsResult.success || !sessionsResult.data) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
        {sessionsResult.error || 'Failed to load sessions for this class.'}
      </div>
    )
  }

  const classData = classResult.data
  const sessions = sessionsResult.data as any[]

  const assignmentsBySession = await Promise.all(
    sessions.map(async (session: any) => {
      const result = await getAssignmentsBySession(session.id)
      return {
        session,
        assignments: result.success ? result.data || [] : [],
      }
    })
  )

  const hasAnyAssignments = assignmentsBySession.some(
    (group) => group.assignments.length > 0
  )

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Assignments for {classData.name}
            </h1>
            <p className="mt-2 text-gray-600">
              View all assignments grouped by session.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/classes/${classId}`}>Back to class</Link>
          </Button>
        </div>
      </header>

      {!hasAnyAssignments ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              No assignments yet for this class. Create assignments from each
              session page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {assignmentsBySession.map(({ session, assignments }) =>
            assignments.length === 0 ? null : (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle>
                    Session {formatDate(session.session_date)}
                  </CardTitle>
                  <CardDescription>
                    {assignments.length} assignment
                    {assignments.length !== 1 ? 's' : ''} for this session.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Due date</TableHead>
                        <TableHead>Max points</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment: any) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.title}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
                              {assignment.mode === 'freeform'
                                ? 'Freeform'
                                : assignment.mode === 'structured'
                                ? 'Structured'
                                : 'Bulk MCQ'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {assignment.due_at
                              ? formatDate(assignment.due_at)
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {typeof assignment.max_points === 'number'
                              ? assignment.max_points
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={`/admin/classes/${classId}/sessions/${session.id}/assignments/${assignment.id}`}
                              >
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </>
  )
}


