import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/supabase/server'

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

  const profile = await getUserProfile()

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  }

  redirect('/student/dashboard')
}
