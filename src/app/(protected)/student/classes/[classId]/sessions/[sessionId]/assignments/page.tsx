import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { getAssignmentsBySession } from '@/lib/actions/assignments/get-assignments'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { FileText } from 'lucide-react'
import type { Database } from '@/types/database'

interface StudentAssignmentsPageProps {
  params: Promise<{ classId: string; sessionId: string }>
}

export async function generateMetadata({
  params,
}: StudentAssignmentsPageProps): Promise<Metadata> {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: sessionData } = await supabase
    .from('class_sessions')
    .select('session_date, classes:class_id(name)')
    .eq('id', sessionId)
    .single()

  type SessionMetadataRow = {
    session_date: string
    classes?: { name?: string | null } | null
  }

  const session = (sessionData || null) as SessionMetadataRow | null

  if (!session) {
    return {
      title: 'Session Not Found',
    }
  }

  const classData = session.classes

  return {
    title: `Assignments - ${formatDate(session.session_date)}`,
    description: `View assignments for ${classData?.name || 'class'} session`,
  }
}

/**
 * Student assignments list for a session
 *
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS, verifies enrollment
 */
export default async function StudentAssignmentsPage({
  params,
}: StudentAssignmentsPageProps) {
  const { classId, sessionId } = await params
  const user = await getUser()

  if (!user) {
    notFound()
  }

  const supabase = await createClient()

  type SessionWithClass = Pick<
    Database['public']['Tables']['class_sessions']['Row'],
    'id' | 'session_date'
  > & {
    classes?: { id: string; name: string } | null
  }

  const [enrollmentResult, sessionResultRaw, assignmentsResult] =
    await Promise.all([
      supabase
        .from('enrollments')
        .select('class_id, user_id')
        .eq('user_id', user.id)
        .eq('class_id', classId)
        .single(),
      supabase
        .from('class_sessions')
        .select(
          `
          id,
          session_date,
          classes:class_id (
            id,
            name
          )
        `
        )
        .eq('id', sessionId)
        .eq('class_id', classId)
        .single(),
      getAssignmentsBySession(sessionId),
    ])

  const sessionResult = sessionResultRaw as {
    data: SessionWithClass | null
    error: unknown
  }

  if (!enrollmentResult.data) {
    notFound()
  }

  if (!sessionResult.data) {
    notFound()
  }

  const session = sessionResult.data
  const classData = session.classes

  const assignments = assignmentsResult.success ? assignmentsResult.data : []

  const assignmentIds = (assignments as any[]).map((a) => a.id as string)

  const { data: submissionsForStudent } =
    assignmentIds.length > 0
      ? await supabase
          .from('assignment_submissions')
          .select('assignment_id, submitted_at, grade')
          .eq('student_id', user.id)
          .in('assignment_id', assignmentIds)
      : { data: [] as any[] }

  const submissionsMap = new Map<
    string,
    { assignment_id: string; submitted_at: string | null; grade: number | null }
  >(
    (submissionsForStudent || []).map((sub: any) => [
      sub.assignment_id as string,
      {
        assignment_id: sub.assignment_id as string,
        submitted_at: sub.submitted_at ?? null,
        grade: sub.grade ?? null,
      },
    ])
  )

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Session Assignments
            </h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'} -{' '}
              {formatDate(session.session_date)}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/student/classes/${classId}/sessions/${sessionId}`}>
              Back to session
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignments
          </CardTitle>
          <CardDescription>
            Assignments available for this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No assignments available for this session
            </p>
          ) : (
            <div className="space-y-3">
              {(assignments as any[]).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {assignment.title}
                    </h3>
                    {assignment.instructions && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {assignment.instructions}
                      </p>
                    )}
                    {assignment.due_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Due {formatDate(assignment.due_at)}
                      </p>
                    )}
                    {(() => {
                      const sub = submissionsMap.get(assignment.id as string)
                      if (!sub) {
                        return (
                          <p className="text-xs text-amber-600 mt-1">
                            Status: Not started
                          </p>
                        )
                      }
                      if (sub.grade === null) {
                        return (
                          <p className="text-xs text-blue-600 mt-1">
                            Status: Submitted
                          </p>
                        )
                      }
                      return (
                        <p className="text-xs text-green-600 mt-1">
                          Status: Graded ({sub.grade})
                        </p>
                      )
                    })()}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      href={`/student/classes/${classId}/sessions/${sessionId}/assignments/${assignment.id}`}
                    >
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}


