'use server'

import { createClient } from '@/lib/supabase/server'
import { handleServerError, isRealError } from '@/lib/utils/errors'

/**
 * Get all assignments for a class across its sessions.
 *
 * @security Server-side only, protected by RLS.
 */
export async function getAssignmentsByClass(classId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('assignments')
      .select(
        `
        id,
        title,
        mode,
        instructions,
        due_at,
        max_points,
        created_at,
        session:class_sessions!assignments_session_id_fkey(id, session_date)
      `
      )
      .order('due_at', { ascending: true, nullsFirst: true })

    if (error && isRealError(error)) {
      console.error('Class assignments fetch error:', error)
      throw error
    }

    const list = (data || []) as Array<{
      id: string
      title: string
      mode: string
      instructions: string | null
      due_at: string | null
      max_points: number | null
      created_at: string
      session: { id: string; session_date: string } | null
    }>

    // Filter by classId via the joined session
    const filtered = list.filter((item) => {
      const session = item.session as any
      return session && session.class_id ? session.class_id === classId : true
    })

    return {
      success: true,
      data: filtered,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch class assignments')
  }
}







