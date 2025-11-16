import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { getQuizzesBySession } from '@/lib/actions/quizzes/get-quizzes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { Plus, FileText } from 'lucide-react'
import { PublishQuizButton } from '@/components/quizzes/PublishQuizButton'

interface QuizzesPageProps {
  params: Promise<{ classId: string; sessionId: string }>
}

export async function generateMetadata({ params }: QuizzesPageProps): Promise<Metadata> {
  const { sessionId } = await params
  const result = await getSessionById(sessionId)
  
  if (!result.success || !result.data) {
    return {
      title: 'Session Not Found',
    }
  }

  const session = result.data
  const classData = session.classes as any

  return {
    title: `Quizzes - ${formatDate(session.session_date)}`,
    description: `Manage quizzes for ${classData?.name || 'class'} session`,
  }
}

/**
 * Quizzes list page for a session
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function QuizzesPage({ params }: QuizzesPageProps) {
  const { classId, sessionId } = await params
  const [sessionResult, quizzesResult] = await Promise.all([
    getSessionById(sessionId),
    getQuizzesBySession(sessionId),
  ])

  if (!sessionResult.success || !sessionResult.data) {
    notFound()
  }

  const session = sessionResult.data
  const classData = session.classes as any
  const quizzes = quizzesResult.success ? quizzesResult.data : []

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Session Quizzes
            </h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'} - {formatDate(session.session_date)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href={`/admin/classes/${classId}/sessions/${sessionId}/quizzes/create`}>
                <Plus className="mr-2 h-4 w-4" />
                Create quiz
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

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No quizzes yet</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Create your first quiz for this session to assess student knowledge.
            </p>
            <Button asChild>
              <Link href={`/admin/classes/${classId}/sessions/${sessionId}/quizzes/create`}>
                <Plus className="mr-2 h-4 w-4" />
                Create quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz: any) => {
            const creator = quiz.creator as any

            return (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="line-clamp-2">{quiz.title}</span>
                  </CardTitle>
                  {quiz.description && (
                    <CardDescription className="line-clamp-3">
                      {quiz.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {creator && (
                    <p className="text-sm text-gray-500">
                      Created by {creator.full_name}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      quiz.is_published 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {quiz.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <Button asChild className="w-full" size="sm">
                      <Link href={`/admin/classes/${classId}/sessions/${sessionId}/quizzes/${quiz.id}`}>
                        View details
                      </Link>
                    </Button>
                    <PublishQuizButton
                      quizId={quiz.id}
                      isPublished={quiz.is_published}
                      classId={classId}
                      sessionId={sessionId}
                      size="sm"
                      variant="outline"
                    />
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

