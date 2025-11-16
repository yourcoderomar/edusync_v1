'use server'

import { createClient, isAdmin } from '@/lib/supabase/server'
import { logError, getErrorMessage, ForbiddenError, type ActionResult } from '@/lib/utils/errors'
import type { Database } from '@/types/database'

type SessionWithRelations = Database['public']['Tables']['class_sessions']['Row'] & {
  creator: {
    id: string
    full_name: string | null
  } | null
  classes: {
    id: string
    name: string
  } | null
}

/**
 * Get all sessions for a specific class
 * 
 * @security Only accessible by authenticated admins
 */
export async function getSessionsByClass(classId: string) {
  try {
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can view class sessions')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        creator:profiles!class_sessions_created_by_fkey(id, full_name)
      `)
      .eq('class_id', classId)
      .order('session_date', { ascending: false })

    if (error) {
      logError(error, 'getSessionsByClass')
      return { success: false, error: 'Failed to fetch sessions' }
    }

    return { success: true, data }
  } catch (error) {
    logError(error, 'getSessionsByClass')
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get a single session by ID
 * 
 * @security Enforced by RLS policies
 */
export async function getSessionById(sessionId: string): Promise<ActionResult<SessionWithRelations>> {
  try {
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can view session details')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        creator:profiles!class_sessions_created_by_fkey(id, full_name),
        classes(id, name)
      `)
      .eq('id', sessionId)
      .single()

    if (error) {
      logError(error, 'getSessionById')
      return { success: false, error: 'Failed to fetch session' }
    }

    return { success: true, data }
  } catch (error) {
    logError(error, 'getSessionById')
    return { success: false, error: getErrorMessage(error) }
  }
}

