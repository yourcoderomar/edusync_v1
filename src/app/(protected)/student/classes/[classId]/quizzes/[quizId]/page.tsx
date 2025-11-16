import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { getQuizById } from '@/lib/actions/quizzes/get-quizzes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { CheckCircle2, XCircle, Clock, FileText } from 'lucide-react'
import { TakeQuizForm } from '@/components/quizzes/TakeQuizForm'

interface QuizViewPageProps {
  params: Promise<{ classId: string; quizId: string }>
}

export async function generateMetadata({ params }: QuizViewPageProps): Promise<Metadata> {
  const { quizId } = await params
  const result = await getQuizById(quizId)
  
  if (!result.success) {
    return {
      title: 'Quiz Not Found',
    }
  }

  const quiz = (result as { success: true; data: { title: string; description: string | null } }).data

  return {
    title: quiz.title,
    description: quiz.description || `View quiz: ${quiz.title}`,
  }
}

/**
 * Student quiz view page
 * Shows quiz details and student's attempt
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS, verifies enrollment
 */
export default async function StudentQuizViewPage({ params }: QuizViewPageProps) {
  const { classId, quizId } = await params
  const user = await getUser()
  
  if (!user) {
    notFound()
  }

  const supabase = await createClient()

  // Verify student is enrolled in this class
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('class_id, user_id')
    .eq('user_id', user.id)
    .eq('class_id', classId)
    .single()

  if (!enrollment) {
    notFound()
  }

  // Fetch quiz data and student's attempt in parallel
  const [quizResult, attemptResult] = await Promise.all([
    getQuizById(quizId),
    // Get student's attempt(s) for this quiz
    supabase
      .from('quiz_attempts')
      .select('id, score, started_at, submitted_at')
      .eq('quiz_id', quizId)
      .eq('student_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ])

  if (!quizResult.success || !quizResult.data) {
    notFound()
  }

  const quiz = quizResult.data
  const attempt = attemptResult.data
  const questions = quiz.questions as any[]
  const session = quiz.session as any
  const creator = quiz.creator as any

  // Get student's answers for this attempt if it exists
  let studentAnswers: Map<string, any> = new Map()
  if (attempt) {
    const { data: answers } = await supabase
      .from('quiz_answers')
      .select('question_id, option_id, is_correct')
      .eq('attempt_id', attempt.id)

    if (answers) {
      answers.forEach((answer: any) => {
        studentAnswers.set(answer.question_id, answer)
      })
    }
  }

  const isSubmitted = attempt && attempt.submitted_at
  const hasScore = attempt && attempt.score !== null

  // Get answers map for TakeQuizForm (convert to object for serialization)
  const answersObj: Record<string, string | null> = {}
  if (attempt) {
    const { data: answers } = await supabase
      .from('quiz_answers')
      .select('question_id, option_id')
      .eq('attempt_id', attempt.id)

    if (answers) {
      answers.forEach((answer: any) => {
        answersObj[answer.question_id] = answer.option_id
      })
    }
  }

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-2 text-gray-600">{quiz.description}</p>
            )}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              {session && (
                <div>
                  <span className="font-medium">Session:</span>{' '}
                  {formatDate(session.session_date)}
                </div>
              )}
              {creator && (
                <div>
                  <span className="font-medium">Created by:</span>{' '}
                  {creator.full_name || 'Unknown'}
                </div>
              )}
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/student/classes/${classId}`}>Back to Class</Link>
          </Button>
        </div>
      </header>

      {/* Attempt Status Card */}
      {attempt ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Attempt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium text-gray-900">
                  {formatDate(attempt.started_at)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(attempt.started_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {isSubmitted ? (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Submitted</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(attempt.submitted_at)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(attempt.submitted_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {hasScore && (
                    <div>
                      <p className="text-sm text-gray-500">Score</p>
                      <p className={`text-3xl font-bold ${
                        attempt.score >= 70 ? 'text-green-600' : 
                        attempt.score >= 50 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {attempt.score}%
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">In Progress</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-center text-gray-700">
              You haven&apos;t started this quiz yet. Click &quot;Take Quiz&quot; to begin.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quiz Taking Form or Review */}
      {!isSubmitted ? (
        <TakeQuizForm
          quizId={quizId}
          questions={questions || []}
          attemptId={attempt?.id || null}
          isSubmitted={false}
          initialAnswers={answersObj}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Questions Review</CardTitle>
            <CardDescription>
              Review your answers and the correct solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions && questions.length > 0 ? (
              questions.map((question, index) => {
                const studentAnswer = studentAnswers.get(question.id)
                const studentOption = question.options?.find(
                  (opt: any) => opt.id === studentAnswer?.option_id
                )
                const correctOption = question.options?.find(
                  (opt: any) => opt.is_correct
                )

                return (
                  <div 
                    key={question.id} 
                    className={`p-4 border rounded-lg ${
                      isSubmitted && studentAnswer
                        ? studentAnswer.is_correct
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg">
                        Question {index + 1}
                      </h3>
                      {isSubmitted && studentAnswer && (
                        <div className="flex items-center gap-2">
                          {studentAnswer.is_correct ? (
                            <span className="flex items-center gap-1 text-green-700 font-medium text-sm">
                              <CheckCircle2 className="h-4 w-4" />
                              Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-700 font-medium text-sm">
                              <XCircle className="h-4 w-4" />
                              Incorrect
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-gray-900 mb-4">{question.question_text}</p>

                    {question.options && question.options.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">Answer Options:</p>
                        {question.options.map((option: any) => {
                          const isStudentAnswer = studentOption?.id === option.id
                          const isCorrect = option.is_correct
                          const showCorrect = isSubmitted

                          return (
                            <div
                              key={option.id}
                              className={`flex items-start gap-2 p-3 rounded border ${
                                isStudentAnswer && isSubmitted
                                  ? isCorrect
                                    ? 'bg-green-100 border-green-300'
                                    : 'bg-red-100 border-red-300'
                                  : isCorrect && showCorrect
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              {showCorrect && isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              ) : isStudentAnswer && isSubmitted && !isCorrect ? (
                                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <span className={`
                                  ${isStudentAnswer && isSubmitted ? 'font-semibold' : ''}
                                  ${isCorrect && showCorrect ? 'text-green-800' : ''}
                                  ${isStudentAnswer && isSubmitted && !isCorrect ? 'text-red-800' : ''}
                                `}>
                                  {option.option_text}
                                </span>
                                {isStudentAnswer && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    (Your answer)
                                  </span>
                                )}
                                {showCorrect && isCorrect && !isStudentAnswer && (
                                  <span className="ml-2 text-xs text-green-600">
                                    (Correct answer)
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No questions available for this quiz.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}

