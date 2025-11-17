import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { getPendingEnrollmentCount } from '@/lib/actions/enrollment/get-pending-count'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'

/**
 * Protected layout for authenticated users
 * 
 * @semantic Uses semantic HTML structure
 * @security Server-side authentication check
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const profile = await getUserProfile()

  if (!user || !profile) {
    redirect('/signin')
  }

  // Type assertion: profile exists after null check
  const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' }

  // Get pending enrollment count for admins
  const pendingCount =
    typedProfile.role === 'admin'
      ? await getPendingEnrollmentCount()
      : typedProfile.role === 'instructor'
        ? await getPendingEnrollmentCount({ instructorId: typedProfile.id })
        : 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Navigation role={typedProfile.role} pendingRequestsCount={pendingCount} />

      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}

