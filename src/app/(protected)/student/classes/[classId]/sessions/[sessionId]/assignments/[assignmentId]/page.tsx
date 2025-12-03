import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { getAssignmentById } from '@/lib/actions/assignments/get-assignments'
import { submitAssignment } from '@/lib/actions/assignments/submit-assignment'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils/format'

interface StudentAssignmentDetailsPageProps {
  params: Promise<{ classId: string; sessionId: string; assignmentId: string }>
}

export async function generateMetadata({
  params,
}: StudentAssignmentDetailsPageProps): Promise<Metadata> {
  const { assignmentId, classId, sessionId } = await params
  const assignmentResult = await getAssignmentById(assignmentId)
  const supabase = await createClient()

  if (!assignmentResult.success || !assignmentResult.data) {
    return {
      title: 'Assignment Not Found',
    }
  }

  const { data: sessionData } = await supabase
    .from('class_sessions')
    .select('session_date, classes:class_id(name)')
    .eq('id', sessionId)
    .single()

  const assignment = assignmentResult.data as any
  const session = sessionData as { session_date: string; classes?: { name?: string | null } | null } | null

  return {
    title: `Assignment - ${assignment.title}`,
    description: session
      ? `View assignment details for ${session.classes?.name || 'class'} session on ${session.session_date}`
      : `View assignment details for class ${classId}`,
  }
}

/**
 * Student assignment details and submission page
 *
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS, verifies enrollment
 */
export default async function StudentAssignmentDetailsPage({
  params,
}: StudentAssignmentDetailsPageProps) {
  const { classId, sessionId, assignmentId } = await params
  const user = await getUser()

  if (!user) {
    notFound()
  }

  const supabase = await createClient()

  const [
    assignmentResult,
    enrollmentResult,
    submissionResult,
    sessionResultRaw,
  ] = await Promise.all([
      getAssignmentById(assignmentId),
      supabase
        .from('enrollments')
        .select('class_id, user_id')
        .eq('user_id', user.id)
        .eq('class_id', classId)
        .single(),
      supabase
        .from('assignment_submissions')
        .select('id, content, submitted_at, grade, feedback')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id)
        .maybeSingle(),
      supabase
        .from('class_sessions')
        .select('session_date, classes:class_id(id, name)')
        .eq('id', sessionId)
        .single(),
    ])

  if (!assignmentResult.success || !assignmentResult.data) {
    notFound()
  }

  const sessionResult = sessionResultRaw as {
    data: {
      session_date: string
      classes?: { id: string; name: string | null } | null
    } | null
  }

  if (!enrollmentResult.data || !sessionResult.data) {
    notFound()
  }

  const assignment = assignmentResult.data as any
  const session = sessionResult.data as {
    session_date: string
    classes?: { id: string; name: string | null } | null
  }
  const classData = session.classes
  const questions = (assignment.questions || []) as any[]
  const isBulkMcq = assignment.mode === 'bulk_mcq'
  const totalPossiblePoints =
    isBulkMcq && questions.length > 0
      ? questions.reduce(
          (sum: number, q: any) =>
            sum + (typeof q.points === 'number' ? q.points : 0),
          0
        )
      : null
  const existingSubmission = submissionResult.data as
    | {
        id: string
        content: string | null
        submitted_at: string | null
        grade: number | null
        feedback: string | null
      }
    | null

  async function handleSubmit(formData: FormData) {
    'use server'

    if (isBulkMcq && questions.length > 0) {
      const answers =
        questions.map((q: any) => {
          const selectedOptionId = formData.get(`question-${q.id}`)
          return {
            questionId: q.id as string,
            selectedOptionId: selectedOptionId
              ? String(selectedOptionId)
              : null,
          }
        }) || []

      await submitAssignment({
        assignmentId,
        answers,
      })
    } else {
      const content = String(formData.get('content') || '')

      await submitAssignment({
        assignmentId,
        content,
      })
    }
  }

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
          <Button asChild variant="outline">
            <Link
              href={`/student/classes/${classId}/sessions/${sessionId}/assignments`}
            >
              Back to assignments
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Read carefully before submitting your work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment.instructions ? (
              <p className="whitespace-pre-wrap text-gray-800">
                {assignment.instructions}
              </p>
            ) : (
              <p className="text-gray-500">No additional instructions.</p>
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
            {questions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Questions
                </p>
                <ol className="space-y-3 list-decimal list-inside text-sm text-gray-800">
                  {questions.map((q: any, index: number) => (
                    <li key={q.id}>
                      <p className="font-medium">
                        {index + 1}. {q.question_text}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>
            <CardDescription>
              {isBulkMcq
                ? 'Select the best answer for each question, then submit.'
                : 'Submit a link or written answer. You can resubmit if needed.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingSubmission && (
              <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-medium">Last submission</p>
                {existingSubmission.submitted_at && (
                  <p className="text-xs text-gray-500">
                    Submitted on {formatDate(existingSubmission.submitted_at)}
                  </p>
                )}
                {existingSubmission.grade !== null && !isBulkMcq && (
                  <p className="mt-1">
                    Grade:{' '}
                    <span className="font-semibold">
                      {existingSubmission.grade}
                    </span>
                  </p>
                )}
                {existingSubmission.grade !== null &&
                  isBulkMcq &&
                  totalPossiblePoints !== null && (
                    <p className="mt-1">
                      Score:{' '}
                      <span className="font-semibold">
                        {existingSubmission.grade} / {totalPossiblePoints}
                      </span>{' '}
                      (
                      {(
                        (existingSubmission.grade / totalPossiblePoints) *
                        100
                      ).toFixed(0)}
                      %)
                    </p>
                  )}
                {existingSubmission.feedback && (
                  <p className="mt-1">
                    Feedback:{' '}
                    <span className="whitespace-pre-wrap">
                      {existingSubmission.feedback}
                    </span>
                  </p>
                )}
              </div>
            )}

            <form action={handleSubmit} className="space-y-3">
              {isBulkMcq && questions.length > 0 ? (
                <div className="space-y-4">
                  {questions.map((q: any, index: number) => (
                    <div key={q.id} className="space-y-2 border rounded-md p-3">
                      <p className="font-medium text-sm text-gray-900">
                        Question {index + 1}
                      </p>
                      <p className="text-sm text-gray-800">
                        {q.question_text}
                      </p>
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {q.options.map((opt: any, optIndex: number) => {
                            const letter = String.fromCharCode(
                              'A'.charCodeAt(0) + optIndex
                            )
                            return (
                              <label
                                key={opt.id}
                                className="flex items-center gap-2 text-sm text-gray-800"
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  value={opt.id}
                                  className="h-4 w-4"
                                />
                                <span className="font-medium">{letter}.</span>
                                <span>{opt.option_text}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <label
                    htmlFor="content"
                    className="text-sm font-medium text-gray-700"
                  >
                    Answer / Link
                  </label>
                  <Textarea
                    id="content"
                    name="content"
                    defaultValue={existingSubmission?.content ?? ''}
                    placeholder="Paste your answer or a link to your work"
                    rows={5}
                  />
                </>
              )}
              <Button type="submit" className="mt-2">
                {existingSubmission ? 'Update submission' : 'Submit assignment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}


