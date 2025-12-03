import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAssignmentById } from '@/lib/actions/assignments/get-assignments'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'

interface AdminAssignmentDetailsPageProps {
  params: Promise<{ classId: string; sessionId: string; assignmentId: string }>
}

export async function generateMetadata({
  params,
}: AdminAssignmentDetailsPageProps): Promise<Metadata> {
  const { assignmentId } = await params
  const result = await getAssignmentById(assignmentId)

  if (!result.success || !result.data) {
    return {
      title: 'Assignment Not Found',
    }
  }

  const assignment = result.data as any
  return {
    title: `Assignment - ${assignment.title}`,
    description: `View assignment details and submissions`,
  }
}

/**
 * Admin/instructor assignment details page
 *
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function AdminAssignmentDetailsPage({
  params,
}: AdminAssignmentDetailsPageProps) {
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

  const supabase = await createClient()
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select(
      `
      id,
      student_id,
      submitted_at,
      grade,
      feedback,
      student:profiles!assignment_submissions_student_id_fkey(id, full_name)
    `
    )
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  const submissionsList = (submissions || []) as any[]
  const totalSubmissions = submissionsList.length
  const gradedSubmissions = submissionsList.filter(
    (s) => typeof s.grade === 'number'
  )
  const averageGrade =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.grade ?? 0), 0) /
        gradedSubmissions.length
      : null

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {assignment.title}
            </h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'} -{' '}
              {formatDate(session.session_date)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link
                href={`/admin/classes/${classId}/sessions/${sessionId}/assignments/${assignmentId}/edit`}
              >
                Edit
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/admin/classes/${classId}/sessions/${sessionId}/assignments`}
              >
                Back to assignments
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Configuration and instructions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Mode</p>
              <p className="text-lg font-medium capitalize">
                {assignment.mode === 'freeform'
                  ? 'Freeform'
                  : assignment.mode === 'structured'
                  ? 'Structured'
                  : 'Bulk MCQ'}
              </p>
            </div>
            {assignment.instructions && (
              <div>
                <p className="text-sm text-gray-500">Instructions</p>
                <p className="whitespace-pre-wrap text-gray-800">
                  {assignment.instructions}
                </p>
              </div>
            )}
            {assignment.due_at && (
              <div>
                <p className="text-sm text-gray-500">Due date</p>
                <p className="text-lg font-medium">
                  <time dateTime={assignment.due_at}>
                    {formatDate(assignment.due_at)}
                  </time>
                </p>
              </div>
            )}
            {typeof assignment.max_points === 'number' && (
              <div>
                <p className="text-sm text-gray-500">Max points</p>
                <p className="text-lg font-medium">{assignment.max_points}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              Overview of student submissions (view-only for now)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              <span>
                Total submissions:{' '}
                <span className="font-semibold">{totalSubmissions}</span>
              </span>
              {averageGrade !== null && (
                <span>
                  Average grade:{' '}
                  <span className="font-semibold">
                    {averageGrade.toFixed(2)}
                  </span>
                </span>
              )}
            </div>
            {!submissions || submissions.length === 0 ? (
              <p className="text-sm text-gray-500">No submissions yet.</p>
            ) : (
              submissionsList.map((sub) => (
                <div
                  key={sub.id}
                  className="border rounded-md p-3 space-y-1 bg-white"
                >
                  <p className="text-sm font-medium">
                    {sub.student?.full_name || 'Unknown student'}
                  </p>
                  {sub.submitted_at && (
                    <p className="text-xs text-gray-500">
                      Submitted on {formatDate(sub.submitted_at)}
                    </p>
                  )}
                  {sub.grade !== null && (
                    <p className="text-sm">
                      Grade:{' '}
                      <span className="font-semibold">{sub.grade}</span>
                    </p>
                  )}
                  {sub.feedback && (
                    <p className="text-xs text-gray-600">
                      Feedback: {sub.feedback}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}


