import type { Metadata } from 'next'
import { getUserProfile, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { ProfileQRCode } from '@/components/profile/ProfileQRCode'

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
  const user = await getUser()

  if (!profile || !user) {
    return (
      <div className="text-center">
        <p className="text-red-600">Profile not found</p>
      </div>
    )
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your personal information and account details
        </p>
      </header>

      <div className="space-y-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Personal Information</CardTitle>
            <CardDescription>
              Update your profile details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ProfileForm
              initialData={{
                full_name: (profile as any).full_name,
                phone: (profile as any).phone,
                parent_phone_number: (profile as any).parent_phone_number,
                profile_picture_url: (profile as any).profile_picture_url,
                role: (profile as any).role,
                email: user.email || null,
              }}
            />
          </CardContent>
        </Card>

        {(profile as any).role === 'student' && (
          <ProfileQRCode userId={user.id} />
        )}
      </div>
    </>
  )
}

