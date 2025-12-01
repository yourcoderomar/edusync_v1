import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getClassById } from '@/lib/actions/classes/get-classes'
import { getUserProfile } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EditClassForm } from '@/components/classes/EditClassForm'

interface EditClassPageProps {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: EditClassPageProps): Promise<Metadata> {
  const { classId } = await params
  const result = await getClassById(classId)
  
  if (!result.success) {
    return {
      title: 'Class Not Found',
    }
  }

  const classData = (result as { success: true; data: { name: string } }).data

  return {
    title: `Edit ${classData.name}`,
    description: `Edit class details for ${classData.name}`,
  }
}

/**
 * Edit class page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS
 */
export default async function EditClassPage({ params }: EditClassPageProps) {
  const { classId } = await params
  const result = await getClassById(classId)

  if (!result.success || !result.data) {
    notFound()
  }

  const classData = result.data
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/signin')
  }

  const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' }
  
  // Check if user can edit this class
  const canEdit = typedProfile.role === 'admin' || 
    (typedProfile.role === 'instructor' && classData.teacher_id === typedProfile.id)

  if (!canEdit) {
    redirect(`/admin/classes/${classId}`)
  }

  return (
    <>
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Class</h1>
            <p className="mt-2 text-gray-600">
              Update the details for {classData.name}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/classes/${classId}`}>Cancel</Link>
          </Button>
        </div>
      </header>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>
            Update the basic information for this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditClassForm
            classId={classId}
            initialData={{
              name: classData.name,
              description: classData.description,
            }}
          />
        </CardContent>
      </Card>
    </>
  )
}


