import type { Metadata } from 'next'
import Link from 'next/link'
import { getClasses } from '@/lib/actions/classes/get-classes'
import { getUserProfile } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ClassCard } from '@/components/classes/ClassCard'

export const metadata: Metadata = {
  title: 'Classes',
  description: 'Manage all classes in your educational platform.',
}

/**
 * Admin classes list page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function AdminClassesPage() {
  const result = await getClasses()
  const profile = await getUserProfile()
  const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' } | null
  const isAdmin = typedProfile?.role === 'admin'
  const currentUserId = typedProfile?.id

  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="mt-2 text-gray-600">
            Manage all your classes and their details
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/classes/create">Create class</Link>
        </Button>
      </header>

      <section aria-labelledby="classes-heading">
        <h2 id="classes-heading" className="sr-only">
          List of classes
        </h2>

        {!result.success ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-red-600">{result.error}</p>
            </CardContent>
          </Card>
        ) : !result.data || result.data.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No classes yet. Create your first class to get started!</p>
              <Button asChild className="mt-4">
                <Link href="/admin/classes/create">Create your first class</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(result as { success: true; data: any[] }).data.map((classItem) => {
              const canEdit = isAdmin || (typedProfile?.role === 'instructor' && classItem.teacher_id === currentUserId)
              const canDelete = isAdmin || (typedProfile?.role === 'instructor' && classItem.teacher_id === currentUserId)
              
              return (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

