'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage, logError } from '@/lib/utils/errors'

/**
 * Sign out server action
 * 
 * @security
 * - Clears session cookies
 * - Invalidates auth token
 */
export async function signOut() {
  try {
    const supabase = await createClient()

    // Sign out from Supabase (clears session)
    const { error } = await supabase.auth.signOut()

    if (error) {
      logError(error, 'signOut - auth error')
      // Still try to redirect even if signOut has an error
      // The session might be invalid anyway
    }

    // Revalidate all paths to clear cached data
    revalidatePath('/', 'layout')
    revalidatePath('/admin', 'layout')
    revalidatePath('/student', 'layout')
    
    // Redirect to sign in page
    redirect('/signin')
  } catch (error) {
    // redirect() throws a special error that should not be caught
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    
    logError(error, 'signOut')
    
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

