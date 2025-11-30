'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
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
  profilePictureUrl?: string | null
  fullName?: string | null
}

/**
 * Full-page mobile menu component
 * Shows burger button on left, logo in center, profile picture on right
 * Full-screen overlay menu with navigation links
 */
export function MobileMenu({ 
  navItems, 
  pendingRequestsCount = 0,
  profilePictureUrl,
  fullName 
}: MobileMenuProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const dashboardPath = pathname.startsWith('/student') 
    ? '/student/dashboard' 
    : '/admin/dashboard'

  return (
    <>
      {/* Burger Button - Only visible when menu is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          aria-expanded={false}
          className="md:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      )}

      {/* Full Page Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div className="absolute inset-0 bg-white flex flex-col">
            {/* Header Bar */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-[#353535]">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="md:hidden"
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Logo - Centered */}
              <Link
                href={dashboardPath}
                className="flex items-center hover:opacity-80 transition-opacity"
                aria-label="Go to dashboard"
                onClick={() => setIsOpen(false)}
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
                className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-[#353535] hover:border-[#353535] transition-colors"
                aria-label={fullName ? `Go to ${fullName}'s profile` : 'Go to profile'}
                onClick={() => setIsOpen(false)}
              >
                {profilePictureUrl ? (
                  <Image
                    src={profilePictureUrl}
                    alt={fullName ? `${fullName}'s profile picture` : 'Profile picture'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[#D2D7DF] flex items-center justify-center">
                    <span className="text-[#353535] text-sm font-medium">
                      {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-4" aria-label="Mobile navigation">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const showCount = item.showBadge && pendingRequestsCount > 0

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'block px-4 py-3 text-base font-medium transition-colors',
                        isActive
                          ? 'bg-[#D2D7DF] text-[#353535] border-l-4 border-[#353535]'
                          : 'text-[#353535] hover:bg-[#D2D7DF] hover:text-[#353535]'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {showCount && (
                          <span
                            className="ml-2 inline-flex items-center justify-center h-6 min-w-[24px] px-2 text-xs font-bold text-white bg-red-600 rounded-full"
                            aria-label={`${pendingRequestsCount} pending requests`}
                          >
                            {pendingRequestsCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Footer with Sign Out */}
            <div className="border-t border-[#353535] p-4">
              <SignOutButton
                variant="ghost"
                size="sm"
                className="!justify-start w-full text-red-700 hover:!bg-red-50 hover:!text-red-700"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
