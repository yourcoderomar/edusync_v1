'use server'

import { createClient } from '@/lib/supabase/server'
import { handleServerError, isRealError } from '@/lib/utils/errors'

/**
 * Get all quizzes for a session
 * 
 * @security Server-side only, protected by RLS
 */
export async function getQuizzesBySession(sessionId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        session:class_sessions!inner(id, session_date, class_id),
        creator:profiles!quizzes_created_by_fkey(id, full_name)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error && isRealError(error)) throw error

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch quizzes')
  }
}

/**
 * Get quiz by ID with questions and options
 * 
 * @security Server-side only, protected by RLS
 */
export async function getQuizById(quizId: string) {
  try {
    const supabase = await createClient()

    // Get quiz details
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        *,
        session:class_sessions!inner(id, session_date, class_id),
        creator:profiles!quizzes_created_by_fkey(id, full_name)
      `)
      .eq('id', quizId)
      .single()

    if (quizError && isRealError(quizError)) throw quizError

    // Get questions with options
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        options:quiz_options(*)
      `)
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true })

    if (questionsError && isRealError(questionsError)) throw questionsError

    // Sort options by order_index for each question
    const questionsWithSortedOptions = questions?.map(question => ({
      ...question,
      options: question.options?.sort((a: any, b: any) => a.order_index - b.order_index) || []
    })) || []

    return {
      success: true,
      data: {
        ...quiz,
        questions: questionsWithSortedOptions,
      },
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch quiz')
  }
}

/**
 * Get quiz statistics
 * 
 * @security Server-side only, protected by RLS
 */
export async function getQuizStats(quizId: string) {
  try {
    const supabase = await createClient()

    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('id, score, submitted_at, student_id')
      .eq('quiz_id', quizId)

    if (error && isRealError(error)) throw error

    const totalAttempts = attempts?.length || 0
    const completedAttempts = attempts?.filter(a => a.submitted_at)?.length || 0
    const scores = attempts?.filter(a => a.score !== null).map(a => a.score as number) || []
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0

    return {
      success: true,
      data: {
        totalAttempts,
        completedAttempts,
        inProgressAttempts: totalAttempts - completedAttempts,
        averageScore: Math.round(averageScore * 10) / 10,
      },
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch quiz statistics')
  }
}

