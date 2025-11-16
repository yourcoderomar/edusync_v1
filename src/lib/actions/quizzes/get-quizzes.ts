'use server'

import { createClient, isAdmin } from '@/lib/supabase/server'
import { handleServerError, isRealError } from '@/lib/utils/errors'

/**
 * Get all quizzes for a session
 * 
 * @security Server-side only, protected by RLS
 */
export async function getQuizzesBySession(sessionId: string) {
  try {
    const supabase = await createClient()
    const userIsAdmin = await isAdmin()

    // Query quizzes for this session
    // RLS will automatically filter:
    // - Admins: RLS policy "admin_manage_quizzes" allows ALL operations (published and unpublished)
    // - Students: RLS policy "students_read_published_quizzes" only allows published quizzes where enrolled
    // 
    // Note: RLS policies are OR'd together, so if admin policy matches, it bypasses student policy
    const result = await supabase
      .from('quizzes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
    
    const quizzes = result.data
    const error = result.error

    if (error && isRealError(error)) {
      console.error('Quizzes fetch error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }

    if (!quizzes || quizzes.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Fetch session and creator data separately to avoid RLS issues with foreign keys
    const quizIds = quizzes.map(q => q.id)
    const creatorIds = [...new Set(quizzes.map(q => q.created_by).filter(Boolean))]
    
    const [sessionsResult, creatorsResult] = await Promise.all([
      supabase
        .from('class_sessions')
        .select('id, session_date, class_id')
        .eq('id', sessionId)
        .maybeSingle(),
      creatorIds.length > 0
        ? supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', creatorIds)
        : { data: [] }
    ])

    const session = sessionsResult.data
    const creators = creatorsResult.data || []
    const creatorsMap = new Map(creators.map((c: any) => [c.id, c]))

    // Combine data
    const quizzesWithRelations = quizzes.map((quiz: any) => ({
      ...quiz,
      session: session || null,
      creator: creatorsMap.get(quiz.created_by) || null,
    }))

    return {
      success: true,
      data: quizzesWithRelations,
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
        session:class_sessions!quizzes_session_id_fkey(id, session_date, class_id),
        creator:profiles!quizzes_created_by_fkey(id, full_name)
      `)
      .eq('id', quizId)
      .single()

    if (quizError && isRealError(quizError)) {
      console.error('Quiz fetch error:', quizError)
      throw quizError
    }

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
    const questionsList = (questions || []) as Array<{ [key: string]: any; options?: Array<{ order_index: number }> }>
    const questionsWithSortedOptions = questionsList.map(question => ({
      ...question,
      options: question.options?.sort((a: any, b: any) => a.order_index - b.order_index) || []
    }))

    // Type assertion for quiz
    if (!quiz) {
      throw new Error('Quiz not found')
    }
    const typedQuiz = quiz as { [key: string]: any }

    return {
      success: true,
      data: {
        ...typedQuiz,
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

    const attemptsList = (attempts || []) as Array<{ id: string; score: number | null; submitted_at: string | null; student_id: string }>
    const totalAttempts = attemptsList.length
    const completedAttempts = attemptsList.filter(a => a.submitted_at).length
    const scores = attemptsList.filter(a => a.score !== null).map(a => a.score as number)
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

/**
 * Get detailed quiz attempts with student information
 * 
 * @security Server-side only, protected by RLS
 */
export async function getQuizAttempts(quizId: string) {
  try {
    const supabase = await createClient()

    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select(`
        id,
        score,
        started_at,
        submitted_at,
        student:profiles!quiz_attempts_student_id_fkey(id, full_name, phone, profile_picture_url)
      `)
      .eq('quiz_id', quizId)
      .order('started_at', { ascending: false })

    if (error && isRealError(error)) {
      console.error('Quiz attempts fetch error:', error)
      throw error
    }

    return {
      success: true,
      data: attempts || [],
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch quiz attempts')
  }
}

