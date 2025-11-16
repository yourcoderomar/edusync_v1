'use server'

import { createClient } from '@/lib/supabase/server'
import { isRealError } from '@/lib/utils/errors'

/**
 * Get count of pending enrollment requests (admin)
 * 
 * @security Server-side only, protected by RLS
 */
export async function getPendingEnrollmentCount() {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('enrollment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error && isRealError(error)) {
      console.error('Pending count fetch error:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Failed to fetch pending enrollment count:', error)
    return 0
  }
}

