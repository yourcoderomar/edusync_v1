import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClassForm } from '@/components/classes/ClassForm'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Create Class',
  description: 'Create a new class to manage students, sessions, and content.',
}

/**
 * Create class page
 * 
 * @semantic Uses semantic HTML with proper structure
 */
export default async function CreateClassPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/signin')
  }

  const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' }
  if (typedProfile.role === 'student') {
    redirect('/student/dashboard')
  }
  const supabase = await createClient()

  let instructors: Array<{ id: string; full_name: string | null }> = []

  if (typedProfile.role === 'admin') {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'instructor')
      .order('full_name', { ascending: true })

    instructors = (data || []) as Array<{ id: string; full_name: string | null }>
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Class</h1>
        <p className="mt-2 text-gray-600">
          Fill in the details to create a new class
        </p>
      </header>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>
            Enter the basic information for your new class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClassForm
            instructors={instructors}
            currentUserRole={typedProfile.role}
            currentUserId={typedProfile.id}
          />
        </CardContent>
      </Card>
    </>
  )
}

