'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

const DropdownMenuContext = React.createContext<{
  closeMenu: () => void
}>({
  closeMenu: () => {},
})

interface DropdownMenuProps {
  children: React.ReactNode
  trigger: React.ReactNode
  align?: 'left' | 'right' | 'center'
  openOnHover?: boolean
  className?: string
  contentClassName?: string
}

/**
 * Dropdown menu component with hover and click support
 * Accessible with proper ARIA attributes
 */
export function DropdownMenu({
  children,
  trigger,
  align = 'right',
  openOnHover = false,
  className,
  contentClassName,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const closeMenu = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleMouseEnter = () => {
    if (openOnHover) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setIsOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (openOnHover) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false)
      }, 150)
    }
  }

  const handleClick = () => {
    if (!openOnHover) {
      setIsOpen(!isOpen)
    }
  }

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isOpen])

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }

  return (
    <DropdownMenuContext.Provider value={{ closeMenu }}>
      <div
        ref={containerRef}
        className={cn('relative', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div onClick={handleClick} role="button" tabIndex={0} aria-expanded={isOpen} aria-haspopup="true">
          {trigger}
        </div>

        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />

            {/* Dropdown Content */}
            <div
              className={cn(
                'absolute top-full mt-2 z-50 bg-white rounded-lg shadow-lg border border-[#353535] min-w-[200px] py-1',
                alignClasses[align],
                contentClassName
              )}
              role="menu"
              aria-orientation="vertical"
            >
              {children}
            </div>
          </>
        )}
      </div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
  asChild?: boolean
  onSelect?: () => void
}

export function DropdownMenuItem({
  children,
  onClick,
  href,
  className,
  asChild = false,
  onSelect,
}: DropdownMenuItemProps) {
  const { closeMenu } = React.useContext(DropdownMenuContext)
  const baseClasses = 'block w-full text-left px-4 py-2 text-sm text-[#353535] hover:bg-[#D2D7DF] hover:text-[#353535] transition-colors cursor-pointer'

  const handleClick = () => {
    onClick?.()
    onSelect?.()
    // Close menu when item is clicked (unless it's a child component that handles its own closing)
    if (!asChild) {
      closeMenu()
    }
  }

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseClasses, className)}
        role="menuitem"
        onClick={handleClick}
      >
        {children}
      </Link>
    )
  }

  if (asChild) {
    return (
      <div 
        className={cn(baseClasses, className)}
        onClick={handleClick}
      >
        {children}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(baseClasses, className)}
      role="menuitem"
    >
      {children}
    </button>
  )
}

interface DropdownMenuSeparatorProps {
  className?: string
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={cn('border-t border-[#353535] my-1', className)} role="separator" />
}

