import type { Metadata } from 'next'
import Link from 'next/link'
import { getClasses } from '@/lib/actions/classes/get-classes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'

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
            {result.data.map((classItem) => (
              <article key={classItem.id}>
                <Link href={`/admin/classes/${classItem.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{classItem.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {classItem.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-500">
                        <time dateTime={classItem.created_at}>
                          Created {formatDate(classItem.created_at)}
                        </time>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

