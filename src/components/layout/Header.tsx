import Link from 'next/link'
import Image from 'next/image'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { getPendingEnrollmentCount } from '@/lib/actions/enrollment/get-pending-count'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { NavigationLinks } from '@/components/layout/NavigationLinks'
import { NotificationMenu } from '@/components/layout/NotificationMenu'
import { SearchBar } from '@/components/layout/SearchBar'
import { ProfileMenu } from '@/components/layout/ProfileMenu'
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
  { name: 'My Learning', href: '/student/my-learning' },
  { name: 'Profile', href: '/profile' },
]

const instructorNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/instructor/dashboard' },
  { name: 'Classes', href: '/admin/classes' },
  { name: 'Students', href: '/admin/students' },
  { name: 'Enrollment Requests', href: '/admin/enrollment-requests', showBadge: true },
  { name: 'Profile', href: '/profile' },
]


/**
 * Main header component with semantic HTML
 * 
 * Desktop: Logo | Nav Links | Notification | Search | Profile
 * Mobile: Burger | Logo (centered) | Profile
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

  const dashboardPath =
    profile.role === 'student'
      ? '/student/dashboard'
      : profile.role === 'instructor'
        ? '/instructor/dashboard'
        : '/admin/dashboard'

  return (
    <header className="sticky top-0 z-50 border-b border-[#353535] bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-16 items-center justify-between gap-4">
          {/* Logo - Left */}
          <Link 
            href={dashboardPath}
            className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
            aria-label="Go to dashboard"
          >
            <Image
              src="/images/logo.png"
              alt={`${process.env.NEXT_PUBLIC_APP_NAME || 'EduSync'} logo`}
              width={195}
              height={60}
              className="object-contain h-12 w-auto"
              priority
              unoptimized
            />
          </Link>

          {/* Search Bar - Between Logo and Links */}
          <SearchBar />

          {/* Navigation Links - Center */}
          <NavigationLinks navItems={navItems} pendingRequestsCount={pendingCount} />

          {/* Right Side Items */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Notification Icon */}
            <NotificationMenu pendingCount={pendingCount} role={profile.role} />

            {/* Profile Menu */}
            <ProfileMenu
              profilePictureUrl={profile.profile_picture_url}
              fullName={profile.full_name}
              profileId={profile.id}
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden h-16 items-center justify-between">
          {/* Burger Menu Button - Left */}
          <MobileMenu
            navItems={navItems}
            pendingRequestsCount={pendingCount}
            profilePictureUrl={profile.profile_picture_url}
            fullName={profile.full_name}
          />

          {/* Logo - Center */}
          <Link 
            href={dashboardPath}
            className="flex items-center hover:opacity-80 transition-opacity absolute left-1/2 -translate-x-1/2"
            aria-label="Go to dashboard"
          >
            <Image
              src="/images/logo.png"
              alt={`${process.env.NEXT_PUBLIC_APP_NAME || 'EduSync'} logo`}
              width={195}
              height={60}
              className="object-contain h-12 w-auto"
              priority
              unoptimized
            />
          </Link>

          {/* Profile Picture - Right */}
          <Link
            href="/profile"
            className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-[#353535] hover:border-[#353535] transition-colors flex-shrink-0"
            aria-label={profile.full_name ? `Go to ${profile.full_name}'s profile` : 'Go to profile'}
          >
            {profile.profile_picture_url ? (
              <Image
                src={profile.profile_picture_url}
                alt={profile.full_name ? `${profile.full_name}'s profile picture` : 'Profile picture'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[#D2D7DF] flex items-center justify-center">
                <span className="text-[#353535] text-sm font-medium">
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}

