import Link from 'next/link'
import Image from 'next/image'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth/signout'

/**
 * Main header component with semantic HTML
 * 
 * @semantic Uses <header> element with proper ARIA labels
 * @security Displays user info from server-side session
 */
export async function Header() {
  const user = await getUser()
  const profile = await getUserProfile()

  if (!user || !profile) {
    return null
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href={profile.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {process.env.NEXT_PUBLIC_APP_NAME}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {profile.picture_url && (
                <div className="relative h-8 w-8 rounded-full overflow-hidden">
                  <Image
                    src={profile.picture_url}
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

            <form action={signOut}>
              <Button 
                type="submit" 
                variant="outline" 
                size="sm"
                aria-label="Sign out"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}

