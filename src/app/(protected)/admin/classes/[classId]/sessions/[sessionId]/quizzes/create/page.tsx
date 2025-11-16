import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { QuizForm } from '@/components/quizzes/QuizForm'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/format'

interface CreateQuizPageProps {
  params: Promise<{ classId: string; sessionId: string }>
}

export async function generateMetadata({ params }: CreateQuizPageProps): Promise<Metadata> {
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
    title: `Create Quiz - ${formatDate(session.session_date)}`,
    description: `Create a new quiz for ${classData?.name || 'class'} session`,
  }
}

/**
 * Create quiz page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side rendered with admin protection
 */
export default async function CreateQuizPage({ params }: CreateQuizPageProps) {
  const { classId, sessionId } = await params
  const result = await getSessionById(sessionId)

  if (!result.success || !result.data) {
    notFound()
  }

  const session = result.data
  const classData = session.classes as any

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Quiz</h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'} - {formatDate(session.session_date)}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/classes/${classId}/sessions/${sessionId}/quizzes`}>
              Back to quizzes
            </Link>
          </Button>
        </div>
      </header>

      <QuizForm sessionId={sessionId} classId={classId} />
    </>
  )
}

