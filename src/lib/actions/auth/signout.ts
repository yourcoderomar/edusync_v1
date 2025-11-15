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

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: 'Failed to sign out',
      }
    }

    // Revalidate and redirect
    revalidatePath('/', 'layout')
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

