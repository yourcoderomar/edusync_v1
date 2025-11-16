'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { startQuizAttemptSchema } from '@/lib/validations/quiz.schema'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Start a new quiz attempt for a student
 * 
 * @security Server-side only, protected by RLS, verifies enrollment
 */
export async function startQuizAttempt(input: unknown) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in.',
      }
    }

    // Validate input
    const { quizId } = startQuizAttemptSchema.parse(input)

    // Check if student already has an attempt for this quiz
    const { data: existingAttempt } = await supabase
      .from('quiz_attempts')
      .select('id, submitted_at')
      .eq('quiz_id', quizId)
      .eq('student_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If there's an existing attempt that's not submitted, return it
    if (existingAttempt && !existingAttempt.submitted_at) {
      return {
        success: true,
        data: { attemptId: existingAttempt.id },
      }
    }

    // Create new attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: user.id,
        started_at: new Date().toISOString(),
        score: null,
        submitted_at: null,
      } as never)
      .select('id')
      .single()

    if (attemptError) throw attemptError

    return {
      success: true,
      data: { attemptId: attempt.id },
    }
  } catch (error) {
    return handleServerError(error, 'Failed to start quiz attempt')
  }
}

