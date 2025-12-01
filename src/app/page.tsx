import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  profile_picture_url?: string | null
}

/**
 * Home page - redirects based on authentication status and role
 * 
 * @security Server-side authentication check
 */
export default async function HomePage() {
  const user = await getUser()

  if (!user) {
    redirect('/signin')
  }

  const profileData = await getUserProfile()

  // Check if profile picture is missing - redirect to setup
  // Type assertion for profile_picture_url which may exist in the actual database
  if (profileData) {
    const profile = profileData as Profile
    if (!profile.profile_picture_url) {
      redirect('/profile/setup')
    }

    if (profile.role === 'admin') {
      redirect('/admin/dashboard')
    }

    if (profile.role === 'instructor') {
      redirect('/instructor/dashboard')
    }
  }

  redirect('/student/dashboard')
}
