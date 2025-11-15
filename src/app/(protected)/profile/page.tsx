import type { Metadata } from 'next'
import { getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View and manage your profile information.',
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Profile page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching
 */
export default async function ProfilePage() {
  const profile = await getUserProfile()

  if (!profile) {
    return (
      <div className="text-center">
        <p className="text-red-600">Profile not found</p>
      </div>
    )
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">
          View and manage your profile information
        </p>
      </header>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your account details and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.picture_url && (
              <div className="flex items-center gap-4">
                <img
                  src={profile.picture_url}
                  alt={`${profile.full_name || 'User'}'s profile picture`}
                  className="h-20 w-20 rounded-full object-cover"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.full_name || 'Not set'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{profile.role}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <time dateTime={profile.created_at}>
                    {formatDate(profile.created_at)}
                  </time>
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account status and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Profile editing features will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

