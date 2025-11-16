import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { getSessionsByClass } from '@/lib/actions/sessions/get-sessions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'

interface SessionsPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: SessionsPageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)
  
  if (!result.success || !result.data) {
    return {
      title: 'Class Not Found',
    }
  }

  return {
    title: `Sessions - ${result.data.name}`,
    description: `View and manage sessions for ${result.data.name}`,
  }
}

/**
 * Class sessions page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function ClassSessionsPage({ params }: SessionsPageProps) {
  const { classId } = await params
  
  // Fetch class and sessions in parallel
  const [classResult, sessionsResult] = await Promise.all([
    getClassById(classId),
    getSessionsByClass(classId),
  ])

  if (!classResult.success || !classResult.data) {
    notFound()
  }

  const classData = classResult.data
  const sessions = sessionsResult.success && sessionsResult.data ? sessionsResult.data : []

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
            <p className="mt-2 text-gray-600">
              {classData.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/classes/${classId}`}>Back to class</Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/classes/${classId}/sessions/create`}>Create session</Link>
            </Button>
          </div>
        </div>
      </header>

      <section aria-labelledby="sessions-heading">
        <h2 id="sessions-heading" className="sr-only">
          List of sessions
        </h2>

        {!sessionsResult.success ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-red-600">{sessionsResult.error}</p>
            </CardContent>
          </Card>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No sessions yet. Create your first session to get started!</p>
              <Button asChild className="mt-4">
                <Link href={`/admin/classes/${classId}/sessions/create`}>Create your first session</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Sessions</CardTitle>
              <CardDescription>
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session: any) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <time dateTime={session.session_date}>
                          {formatDate(session.session_date)}
                        </time>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        {session.creator?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/classes/${classId}/sessions/${session.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  )
}

