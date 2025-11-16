'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/SignOutButton'

interface NavItem {
  name: string
  href: string
  showBadge?: boolean
}

interface MobileMenuProps {
  navItems: NavItem[]
  pendingRequestsCount?: number
}

/**
 * Mobile menu component with burger icon
 * Shows navigation items and logout option
 */
export function MobileMenu({ navItems, pendingRequestsCount = 0 }: MobileMenuProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)


  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 md:hidden">
            <div className="py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const showCount = item.showBadge && pendingRequestsCount > 0
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'block px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span>{item.name}</span>
                      {showCount && (
                        <span 
                          className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-red-600 rounded-full"
                          aria-label={`${pendingRequestsCount} pending requests`}
                        >
                          {pendingRequestsCount}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
              
              {/* Divider */}
              <div className="border-t border-gray-200 my-2" />
              
              {/* Sign Out */}
              <div className="px-4 py-2">
                <SignOutButton 
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-700 hover:bg-red-50 hover:text-red-700"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

