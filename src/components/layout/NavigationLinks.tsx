'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  name: string
  href: string
  showBadge?: boolean
}

interface NavigationLinksProps {
  navItems: NavItem[]
  pendingRequestsCount?: number
}

/**
 * Navigation links component for desktop header
 * Shows navigation items with active state indicators
 */
export function NavigationLinks({ navItems, pendingRequestsCount = 0 }: NavigationLinksProps) {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
      {navItems
        .filter((item) => item.href !== '/profile') // Exclude profile from nav links (it's in dropdown)
        .map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const showCount = item.showBadge && pendingRequestsCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-[#D2D7DF] text-[#353535]'
                  : 'text-[#353535] hover:bg-[#D2D7DF] hover:text-[#353535]'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="flex items-center gap-2">
                {item.name}
                {showCount && (
                  <span
                    className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-red-600 rounded-full"
                    aria-label={`${pendingRequestsCount} pending requests`}
                  >
                    {pendingRequestsCount}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
    </nav>
  )
}

