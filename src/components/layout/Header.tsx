import Link from 'next/link'
import Image from 'next/image'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { getPendingEnrollmentCount } from '@/lib/actions/enrollment/get-pending-count'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { SignOutButton } from '@/components/auth/SignOutButton'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  profile_picture_url?: string | null
}

interface NavItem {
  name: string
  href: string
  showBadge?: boolean
}

const adminNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Classes', href: '/admin/classes' },
  { name: 'Students', href: '/admin/students' },
  { name: 'Enrollment Requests', href: '/admin/enrollment-requests', showBadge: true },
  { name: 'Profile', href: '/profile' },
]

const studentNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/student/dashboard' },
  { name: 'Instructors', href: '/student/instructors' },
  { name: 'Enrollment Requests', href: '/student/enrollment-requests' },
  { name: 'Profile', href: '/profile' },
]

const instructorNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Classes', href: '/admin/classes' },
  { name: 'Enrollment Requests', href: '/admin/enrollment-requests', showBadge: true },
  { name: 'Profile', href: '/profile' },
]


/**
 * Main header component with semantic HTML
 * 
 * @semantic Uses <header> element with proper ARIA labels
 * @security Displays user info from server-side session
 */
export async function Header() {
  const user = await getUser()
  const profileData = await getUserProfile()

  if (!user || !profileData) {
    return null
  }

  // Type assertion for profile_picture_url which may exist in the actual database
  const profile = profileData as Profile

  const navItemsMap: Record<Profile['role'], NavItem[]> = {
    admin: adminNavItems,
    student: studentNavItems,
    instructor: instructorNavItems,
  }

  const navItems = navItemsMap[profile.role] || studentNavItems
  const pendingCount =
    profile.role === 'admin'
      ? await getPendingEnrollmentCount()
      : profile.role === 'instructor'
        ? await getPendingEnrollmentCount({ instructorId: profile.id })
        : 0

  const dashboardPath = profile.role === 'student' ? '/student/dashboard' : '/admin/dashboard'

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href={dashboardPath}
              className="flex items-center hover:opacity-80 transition-opacity"
              aria-label="Go to dashboard"
            >
              <Image
                src="/images/logo.png"
                alt={`${process.env.NEXT_PUBLIC_APP_NAME} logo`}
                width={130}
                height={40}
                className="object-contain h-8 w-auto"
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {profile.profile_picture_url && (
                <div className="relative h-8 w-8 rounded-full overflow-hidden">
                  <Image
                    src={profile.profile_picture_url}
                    alt={`${profile.full_name || 'User'}'s profile picture`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {profile.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {profile.role}
                </p>
              </div>
            </div>

            {/* Desktop Sign Out Button - Hidden on mobile */}
            <div className="hidden md:block">
              <SignOutButton 
                variant="outline" 
                size="sm"
                className="gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
              />
            </div>

            {/* Mobile Burger Menu - Hidden on desktop */}
            <div className="md:hidden">
              <MobileMenu navItems={navItems} pendingRequestsCount={pendingCount} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

