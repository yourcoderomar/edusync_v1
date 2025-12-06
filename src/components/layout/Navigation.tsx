'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  name: string
  href: string
  icon?: React.ReactNode
  showBadge?: boolean
}

interface NavigationProps {
  role: 'admin' | 'student' | 'instructor'
  pendingRequestsCount?: number
}

const adminNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Classes', href: '/admin/classes' },
  { name: 'Students', href: '/admin/students' },
  { name: 'Guest Accounts', href: '/admin/guests' },
  { name: 'Enrollment Requests', href: '/admin/enrollment-requests', showBadge: true },
  { name: 'Profile', href: '/profile' },
]

const studentNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/student/dashboard' },
  { name: 'My Learning', href: '/student/my-learning' },
  { name: 'Instructors', href: '/student/instructors' },
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
 * Navigation component with semantic HTML
 * 
 * @semantic Uses <nav> element with proper ARIA labels
 * @accessibility Keyboard navigation and focus states
 */
export function Navigation({ role, pendingRequestsCount = 0 }: NavigationProps) {
  const pathname = usePathname()
  const navItemsMap: Record<NavigationProps['role'], NavItem[]> = {
    admin: adminNavItems,
    instructor: instructorNavItems,
    student: studentNavItems,
  }
  const navItems = navItemsMap[role] || studentNavItems

  return (
    <nav 
      className="sticky top-16 z-40 bg-white border-b border-gray-200"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const showCount = item.showBadge && pendingRequestsCount > 0
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors relative',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.name}
                {showCount && (
                  <span 
                    className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-red-600 rounded-full"
                    aria-label={`${pendingRequestsCount} pending requests`}
                  >
                    {pendingRequestsCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

      </div>
    </nav>
  )
}

