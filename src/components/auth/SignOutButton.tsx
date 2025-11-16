'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/actions/auth/signout'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'

interface SignOutButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

/**
 * Client-side sign out button with loading state
 * Handles logout with proper error handling and fallback redirect
 */
export function SignOutButton({ 
  variant = 'outline', 
  size = 'sm',
  className = '',
  showIcon = true,
  children
}: SignOutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    
    try {
      const result = await signOut()
      
      // If signOut returns an error (doesn't redirect), handle it
      if (result && !result.success) {
        console.error('Sign out error:', result.error)
        // Force redirect even if signOut failed
        router.push('/signin')
        router.refresh()
      }
      // If successful, redirect() will be called by the server action
      // The redirect() throws a special error that Next.js handles
    } catch (error) {
      // redirect() throws a special error with 'digest' property
      // This is expected and Next.js handles the redirect automatically
      if (error && typeof error === 'object' && 'digest' in error) {
        // This is the redirect error, let Next.js handle it
        return
      }
      
      // If it's a real error, log it and redirect manually
      console.error('Sign out error:', error)
      router.push('/signin')
      router.refresh()
    } finally {
      // Only set loading to false if redirect didn't happen
      // (redirect will cause component unmount anyway)
      setTimeout(() => setIsLoading(false), 100)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
      aria-label={isLoading ? 'Signing out...' : 'Sign out'}
    >
      {isLoading ? (
        <>
          <Loader size="sm" className="mr-2" inline />
          <span>Signing out...</span>
        </>
      ) : (
        <>
          {showIcon && <LogOut className="h-4 w-4" />}
          {children || <span>Sign out</span>}
        </>
      )}
    </Button>
  )
}

