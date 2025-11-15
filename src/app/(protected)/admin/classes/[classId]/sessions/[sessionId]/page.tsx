import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'

interface SessionDetailsPageProps {
  params: Promise<{ classId: string; sessionId: string }>
}

export async function generateMetadata({ params }: SessionDetailsPageProps): Promise<Metadata> {
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
    title: `Session - ${formatDate(session.session_date)}`,
    description: `View session details for ${classData?.name || 'class'}`,
  }
}

/**
 * Session details page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function SessionDetailsPage({ params }: SessionDetailsPageProps) {
  const { classId, sessionId } = await params
  const result = await getSessionById(sessionId)

  if (!result.success || !result.data) {
    notFound()
  }

  const session = result.data
  const classData = session.classes as any
  const creator = session.creator as any

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Session - {formatDate(session.session_date)}
            </h1>
            <p className="mt-2 text-gray-600">
              {classData?.name || 'Unknown Class'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/classes/${classId}/sessions`}>Back to sessions</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Session Info</CardTitle>
            <CardDescription>Basic session information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-lg font-medium">
                <time dateTime={session.session_date}>
                  {formatDate(session.session_date)}
                </time>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Time</p>
              <p className="text-lg font-medium">
                {session.starts_at ? (
                  <time dateTime={session.starts_at}>
                    {new Date(session.starts_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                ) : (
                  <span className="text-gray-400">Not set</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Time</p>
              <p className="text-lg font-medium">
                {session.ends_at ? (
                  <time dateTime={session.ends_at}>
                    {new Date(session.ends_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                ) : (
                  <span className="text-gray-400">Not set</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="text-lg font-medium">{creator?.full_name || 'Unknown'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Track student attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/admin/classes/${classId}/sessions/${sessionId}/attendance`}>
                View attendance
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quizzes</CardTitle>
            <CardDescription>Session quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/admin/classes/${classId}/sessions/${sessionId}/quizzes`}>
                View quizzes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
