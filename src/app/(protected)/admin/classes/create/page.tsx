import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClassForm } from '@/components/classes/ClassForm'

export const metadata: Metadata = {
  title: 'Create Class',
  description: 'Create a new class to manage students, sessions, and content.',
}

/**
 * Create class page
 * 
 * @semantic Uses semantic HTML with proper structure
 */
export default function CreateClassPage() {
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
          <ClassForm />
        </CardContent>
      </Card>
    </>
  )
}

