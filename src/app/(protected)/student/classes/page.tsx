import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'My Classes',
  description: 'View all your enrolled classes.',
}

/**
 * Student classes page
 * 
 * @todo Implement enrolled classes list and browse available classes
 */
export default function StudentClassesPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="mt-2 text-gray-600">
          View your enrolled classes and browse available classes
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
          <CardDescription>
            This feature is ready to be implemented
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Implement fetching enrolled classes and available classes for enrollment.
          </p>
        </CardContent>
      </Card>
    </>
  )
}

