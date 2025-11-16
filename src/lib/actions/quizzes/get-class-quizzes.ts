'use server'

import { createClient } from '@/lib/supabase/server'
import { handleServerError, isRealError } from '@/lib/utils/errors'

/**
 * Get all quizzes for a class
 * Includes quizzes directly connected to class and quizzes connected through sessions
 * 
 * @security Server-side only, protected by RLS
 */
export async function getQuizzesByClass(classId: string) {
  try {
    const supabase = await createClient()

    // Get quizzes in two ways:
    // 1. Quizzes directly connected to the class via class_id
    // 2. Quizzes connected through sessions

    // First get all session IDs for this class
    const { data: sessions, error: sessionsError } = await supabase
      .from('class_sessions')
      .select('id')
      .eq('class_id', classId)

    if (sessionsError && isRealError(sessionsError)) {
      console.error('Sessions fetch error:', sessionsError)
      throw sessionsError
    }

    const sessionIds = sessions ? (sessions as Array<{ id: string }>).map(s => s.id) : []

    // Get quizzes in parallel: directly connected to class AND through sessions
    // Note: RLS policy will automatically filter to only published quizzes for students
    // Admins will see all quizzes regardless of publish status
    // We need to get:
    // 1. Quizzes with class_id = classId (regardless of session_id or publish status)
    // 2. Quizzes with session_id in the class's sessions (regardless of class_id, including NULL)
    const [directQuizzesResult, sessionQuizzesResult] = await Promise.all([
      // Quizzes directly connected to class via class_id
      // RLS will handle filtering for students (only published)
      supabase
        .from('quizzes')
        .select(`
          *,
          session:class_sessions!quizzes_session_id_fkey(id, session_date, class_id),
          creator:profiles!quizzes_created_by_fkey(id, full_name)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false }),
      // Quizzes connected through sessions (if there are sessions)
      // This includes quizzes with session_id pointing to sessions in this class,
      // even if their class_id is NULL or different
      // RLS will handle filtering for students (only published)
      sessionIds.length > 0
        ? supabase
            .from('quizzes')
            .select(`
              *,
              session:class_sessions!quizzes_session_id_fkey(id, session_date, class_id),
              creator:profiles!quizzes_created_by_fkey(id, full_name)
            `)
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })
        : { data: [], error: null }
    ])

    if (directQuizzesResult.error && isRealError(directQuizzesResult.error)) {
      console.error('Direct quizzes fetch error:', directQuizzesResult.error)
      throw directQuizzesResult.error
    }

    if (sessionQuizzesResult.error && isRealError(sessionQuizzesResult.error)) {
      console.error('Session quizzes fetch error:', sessionQuizzesResult.error)
      throw sessionQuizzesResult.error
    }

    // Combine results and remove duplicates (in case a quiz has both class_id and session_id)
    const directQuizzes = directQuizzesResult.data || []
    const sessionQuizzes = sessionQuizzesResult.data || []
    
    // Create a map to avoid duplicates
    const quizzesMap = new Map()
    
    // Add direct quizzes
    directQuizzes.forEach((quiz: any) => {
      quizzesMap.set(quiz.id, quiz)
    })
    
    // Add session quizzes (will overwrite if duplicate, but that's fine)
    sessionQuizzes.forEach((quiz: any) => {
      quizzesMap.set(quiz.id, quiz)
    })
    
    // Convert map to array and sort by created_at
    const allQuizzes = Array.from(quizzesMap.values()).sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return {
      success: true,
      data: allQuizzes,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch class quizzes')
  }
}

