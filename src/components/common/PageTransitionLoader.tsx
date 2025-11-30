'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Loader } from './Loader'

/**
 * Page transition loader component
 * Shows a loading overlay during page navigation
 * 
 * @accessibility Proper ARIA attributes for screen readers
 */
export function PageTransitionLoader() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const currentPathRef = useRef(pathname)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // If pathname changed, we're navigating
    if (pathname !== currentPathRef.current) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }

      // Show loader immediately
      setIsLoading(true)
      currentPathRef.current = pathname
      
      // Hide loader after navigation completes
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false)
        }, 150)
      })
    }
  }, [pathname])

  // Listen to link clicks to show loader immediately on navigation start
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href]')
      
      if (link) {
        const href = (link as HTMLAnchorElement).href
        const currentUrl = window.location.href
        
        // Only show loader for internal navigation (same origin)
        if (href.startsWith(window.location.origin) && href !== currentUrl) {
          // Don't show for hash links (same page anchors)
          const url = new URL(href)
          const currentUrlObj = new URL(currentUrl)
          
          if (url.pathname !== currentUrlObj.pathname || url.search !== currentUrlObj.search) {
            setIsLoading(true)
          }
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  if (!isLoading) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-200"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <Loader variant="pencil" size="lg" text="Loading..." />
    </div>
  )
}

