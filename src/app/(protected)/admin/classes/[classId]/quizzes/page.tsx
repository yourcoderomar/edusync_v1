import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { getQuizzesByClass } from '@/lib/actions/quizzes/get-class-quizzes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { FileText, Calendar } from 'lucide-react'

interface ClassQuizzesPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: ClassQuizzesPageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)
  
  if (!result.success || !result.data) {
    return {
      title: 'Class Not Found',
    }
  }

  const classData = result.data

  return {
    title: `Quizzes - ${classData.name}`,
    description: `View all quizzes for ${classData.name}`,
  }
}

/**
 * Class quizzes page - shows all quizzes across all sessions
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function ClassQuizzesPage({ params }: ClassQuizzesPageProps) {
  const { classId } = await params
  const [classResult, quizzesResult] = await Promise.all([
    getClassById(classId),
    getQuizzesByClass(classId),
  ])

  if (!classResult.success || !classResult.data) {
    notFound()
  }

  const classData = classResult.data
  const quizzes = quizzesResult.success ? quizzesResult.data : []

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              All Quizzes
            </h1>
            <p className="mt-2 text-gray-600">
              {classData.name}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/classes/${classId}`}>
              Back to class
            </Link>
          </Button>
        </div>
      </header>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No quizzes yet</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Quizzes will appear here once they are created for any session in this class.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz: any) => {
            const creator = quiz.creator as any
            const session = quiz.session as any

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
                  {session && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Session: {formatDate(session.session_date)}</span>
                    </div>
                  )}

                  {creator && (
                    <p className="text-sm text-gray-500">
                      Created by {creator.full_name}
                    </p>
                  )}

                  <div className="pt-4 border-t">
                    <Button asChild className="w-full" size="sm">
                      <Link href={`/admin/classes/${classId}/sessions/${session?.id}/quizzes/${quiz.id}`}>
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

