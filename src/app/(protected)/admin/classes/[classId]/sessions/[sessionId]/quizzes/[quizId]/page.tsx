import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getQuizById, getQuizStats } from '@/lib/actions/quizzes/get-quizzes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { Target, User, CheckCircle2, XCircle } from 'lucide-react'
import { DeleteQuizButton } from '@/components/quizzes/DeleteQuizButton'

interface QuizDetailsPageProps {
  params: Promise<{ classId: string; sessionId: string; quizId: string }>
}

export async function generateMetadata({ params }: QuizDetailsPageProps): Promise<Metadata> {
  const { quizId } = await params
  const result = await getQuizById(quizId)
  
  if (!result.success || !result.data) {
    return {
      title: 'Quiz Not Found',
    }
  }

  const quiz = result.data

  return {
    title: `${quiz.title} - Quiz Details`,
    description: quiz.description || 'View quiz details and statistics',
  }
}

/**
 * Quiz details page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function QuizDetailsPage({ params }: QuizDetailsPageProps) {
  const { classId, sessionId, quizId } = await params
  const [quizResult, statsResult] = await Promise.all([
    getQuizById(quizId),
    getQuizStats(quizId),
  ])

  if (!quizResult.success || !quizResult.data) {
    notFound()
  }

  const quiz = quizResult.data
  const stats = statsResult.success ? statsResult.data : null
  const session = quiz.session as any
  const creator = quiz.creator as any
  const questions = quiz.questions as any[]

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-2 text-gray-600">{quiz.description}</p>
            )}
          </div>
          <div className="flex gap-3">
            <DeleteQuizButton
              quizId={quizId}
              sessionId={sessionId}
              classId={classId}
            />
            <Button asChild variant="outline">
              <Link href={`/admin/classes/${classId}/sessions/${sessionId}/quizzes`}>
                Back to quizzes
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 mb-8 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">
                {stats?.totalAttempts || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold">
                {stats?.averageScore ? `${stats.averageScore}%` : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quiz Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="text-lg font-medium">{creator?.full_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Session Date</p>
              <p className="text-lg font-medium">
                <time dateTime={session?.session_date}>
                  {formatDate(session?.session_date)}
                </time>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="text-lg font-medium">{questions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>Review all quiz questions and answers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">
                  Question {index + 1}
                </h3>
              </div>

              <p className="text-gray-900 mb-4">{question.question_text}</p>

              {question.options && question.options.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Answer Options:</p>
                  {question.options.map((option: any) => (
                    <div
                      key={option.id}
                      className={`flex items-start gap-2 p-3 rounded ${
                        option.is_correct
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      {option.is_correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={option.is_correct ? 'font-medium' : ''}>
                        {option.option_text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}

