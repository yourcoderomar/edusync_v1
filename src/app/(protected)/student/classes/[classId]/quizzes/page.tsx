import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { getQuizzesByClass } from '@/lib/actions/quizzes/get-class-quizzes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface QuizzesPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: QuizzesPageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)
  
  if (!result.success) {
    return {
      title: 'Class Not Found',
    }
  }

  const classData = (result as { success: true; data: { name: string } }).data

  return {
    title: `Quizzes - ${classData.name}`,
    description: `View all quizzes for ${classData.name}`,
  }
}

/**
 * Student quizzes list page for a class
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS, verifies enrollment
 */
export default async function StudentQuizzesPage({ params }: QuizzesPageProps) {
  const { classId } = await params
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

  // Fetch class and quizzes
  const [classResult, quizzesResult] = await Promise.all([
    getClassById(classId),
    getQuizzesByClass(classId),
  ])

  if (!classResult.success || !classResult.data) {
    notFound()
  }

  const classData = classResult.data
  const quizzes = quizzesResult.success ? quizzesResult.data : []

  // Get quiz attempts for this student
  const quizIds = (quizzes as any[]).map(q => q.id)
  const { data: quizAttempts } = quizIds.length > 0
    ? await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, submitted_at')
        .eq('student_id', user.id)
        .in('quiz_id', quizIds)
    : { data: [] }

  const attemptsMap = new Map()
  if (quizAttempts) {
    quizAttempts.forEach((attempt: any) => {
      attemptsMap.set(attempt.quiz_id, attempt)
    })
  }

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Class Quizzes</h1>
            <p className="mt-2 text-gray-600">
              {classData.name}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/student/classes/${classId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Class
            </Link>
          </Button>
        </div>
      </header>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No quizzes yet</h2>
            <p className="text-gray-600 text-center max-w-md">
              No quizzes have been created for this class yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz: any) => {
            const attempt = attemptsMap.get(quiz.id)
            const isCompleted = attempt && attempt.submitted_at
            const hasScore = attempt && attempt.score !== null
            const session = quiz.session as any
            
            return (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {quiz.title}
                  </CardTitle>
                  {quiz.description && (
                    <CardDescription className="line-clamp-2">
                      {quiz.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {session && (
                    <div>
                      <p className="text-sm text-gray-500">Session</p>
                      <p className="text-sm font-medium">
                        {formatDate(session.session_date)}
                      </p>
                    </div>
                  )}

                  {isCompleted && (
                    <div>
                      <p className="text-sm text-gray-500">Your Score</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-2xl font-bold ${
                          hasScore && attempt.score >= 70 ? 'text-green-600' :
                          hasScore && attempt.score >= 50 ? 'text-yellow-600' :
                          hasScore ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {hasScore ? `${attempt.score}%` : 'Submitted'}
                        </p>
                        {hasScore && attempt.score >= 70 && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  )}

                  <Button asChild className="w-full" size="sm" variant={isCompleted ? "outline" : "default"}>
                    <Link href={`/student/classes/${classId}/quizzes/${quiz.id}`}>
                      {isCompleted ? 'Review Quiz' : 'Take Quiz'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

