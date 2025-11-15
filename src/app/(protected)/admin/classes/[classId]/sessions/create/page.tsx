import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { Button } from '@/components/ui/button'
import { SessionForm } from '@/components/sessions/SessionForm'

interface CreateSessionPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: CreateSessionPageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)
  
  if (!result.success || !result.data) {
    return {
      title: 'Class Not Found',
    }
  }

  return {
    title: `Create Session - ${result.data.name}`,
    description: `Create a new session for ${result.data.name}`,
  }
}

/**
 * Create session page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side class validation, client form with server action
 */
export default async function CreateSessionPage({ params }: CreateSessionPageProps) {
  const { classId } = await params
  const result = await getClassById(classId)

  if (!result.success || !result.data) {
    notFound()
  }

  const classData = result.data

  return (
    <>
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Session</h1>
            <p className="mt-2 text-gray-600">
              {classData.name}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/classes/${classId}/sessions`}>Back to sessions</Link>
          </Button>
        </div>
      </header>

      <div className="max-w-2xl">
        <SessionForm classId={classId} />
      </div>
    </>
  )
}
