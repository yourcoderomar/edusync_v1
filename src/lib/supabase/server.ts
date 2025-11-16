import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client for server-side operations
 * This client is used in Server Components, Server Actions, and Route Handlers
 * 
 * @security 
 * - Uses cookies for session management (HTTP-only, secure)
 * - All database operations go through RLS policies
 * - Never exposes sensitive data to client
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates an admin Supabase client with service role key
 * This bypasses RLS policies - USE WITH EXTREME CAUTION
 * 
 * @security 
 * - ONLY use for trusted server-side operations
 * - Never expose to client
 * - Bypasses ALL RLS policies
 * - Use only when necessary (e.g., user creation, admin operations)
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Gets the current authenticated user
 * Returns null if not authenticated
 * 
 * @security Always validate user session server-side
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Gets the current user's profile with role information
 * Returns null if not authenticated or profile not found
 * 
 * @security 
 * - Always fetch from server
 * - Validate role before granting access
 * - Never trust client-side role data
 */
export async function getUserProfile() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return null
  }

  return profile
}

/**
 * Checks if the current user is an admin
 * 
 * @security Always use this for admin route protection
 */
export async function isAdmin() {
  const profile = await getUserProfile()
  const typedProfile = profile as { role: 'admin' | 'student' } | null
  return typedProfile?.role === 'admin'
}

/**
 * Checks if the current user is a student
 * 
 * @security Always use this for student route protection
 */
export async function isStudent() {
  const profile = await getUserProfile()
  const typedProfile = profile as { role: 'admin' | 'student' } | null
  return typedProfile?.role === 'student'
}

