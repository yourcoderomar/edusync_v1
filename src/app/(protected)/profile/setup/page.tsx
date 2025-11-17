import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { ProfileSetupForm } from '@/components/profile/ProfileSetupForm'

/**
 * Profile setup page - mandatory profile picture upload for first-time users
 * 
 * @security Server-side authentication check
 */
export default async function ProfileSetupPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/signin')
  }

  // Type assertion: profile exists after null check
  const typedProfile = profile as { role: 'admin' | 'student' | 'instructor'; profile_picture_url: string | null }

  // If profile picture already exists, redirect to dashboard
  if (typedProfile.profile_picture_url) {
    const redirectPath = typedProfile.role === 'admin' || typedProfile.role === 'instructor'
      ? '/admin/dashboard'
      : '/student/dashboard'
    redirect(redirectPath)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please upload a profile picture to continue
          </p>
        </div>
        <ProfileSetupForm />
      </div>
    </div>
  )
}

