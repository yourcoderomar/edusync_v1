'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  name: string
  href: string
  icon?: React.ReactNode
}

interface NavigationProps {
  role: 'admin' | 'student'
}

const adminNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Classes', href: '/admin/classes' },
  { name: 'Students', href: '/admin/students' },
  { name: 'Enrollment Requests', href: '/admin/enrollment-requests' },
  { name: 'Profile', href: '/profile' },
]

const studentNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/student/dashboard' },
  { name: 'My Classes', href: '/student/classes' },
  { name: 'Enrollment Requests', href: '/student/enrollment-requests' },
  { name: 'Profile', href: '/profile' },
]

/**
 * Navigation component with semantic HTML
 * 
 * @semantic Uses <nav> element with proper ARIA labels
 * @accessibility Keyboard navigation and focus states
 */
export function Navigation({ role }: NavigationProps) {
  const pathname = usePathname()
  const navItems = role === 'admin' ? adminNavItems : studentNavItems

  return (
    <nav 
      className="bg-white border-b border-gray-200"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

