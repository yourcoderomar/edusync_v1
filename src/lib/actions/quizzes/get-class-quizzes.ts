'use server'

import { createClient } from '@/lib/supabase/server'
import { handleServerError, isRealError } from '@/lib/utils/errors'

/**
 * Get all quizzes for a class (across all sessions)
 * 
 * @security Server-side only, protected by RLS
 */
export async function getQuizzesByClass(classId: string) {
  try {
    const supabase = await createClient()

    // First get all session IDs for this class
    const { data: sessions, error: sessionsError } = await supabase
      .from('class_sessions')
      .select('id')
      .eq('class_id', classId)

    if (sessionsError && isRealError(sessionsError)) {
      console.error('Sessions fetch error:', sessionsError)
      throw sessionsError
    }

    if (!sessions || sessions.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    const sessionIds = (sessions as Array<{ id: string }>).map(s => s.id)

    // Then get all quizzes for these sessions
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        session:class_sessions!quizzes_session_id_fkey(id, session_date, class_id),
        creator:profiles!quizzes_created_by_fkey(id, full_name)
      `)
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false })

    if (error && isRealError(error)) {
      console.error('Class quizzes fetch error:', error)
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch class quizzes')
  }
}

