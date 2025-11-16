'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { submitQuizAnswerSchema } from '@/lib/validations/quiz.schema'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Save or update a quiz answer for a question
 * 
 * @security Server-side only, protected by RLS, verifies ownership
 */
export async function saveQuizAnswer(input: unknown) {
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
    const { attemptId, questionId, selectedOptionId, answerText } = submitQuizAnswerSchema.parse(input)

    // Verify the attempt belongs to the user
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('id, submitted_at')
      .eq('id', attemptId)
      .eq('student_id', user.id)
      .single()

    if (attemptError || !attempt) {
      return {
        success: false,
        error: 'Quiz attempt not found or unauthorized.',
      }
    }

    // Can't modify answers after submission
    if (attempt.submitted_at) {
      return {
        success: false,
        error: 'Cannot modify answers after quiz submission.',
      }
    }

    // option_id is NOT NULL in the database, so we can only save if an option is selected
    if (!selectedOptionId) {
      return {
        success: false,
        error: 'Please select an option to save.',
      }
    }

    // Get the correct answer to check if this is correct
    const { data: option, error: optionError } = await supabase
      .from('quiz_options')
      .select('is_correct')
      .eq('id', selectedOptionId)
      .single()

    if (optionError || !option) {
      return {
        success: false,
        error: 'Invalid option selected.',
      }
    }

    const isCorrect = option.is_correct || false

    // Check if answer already exists
    const { data: existingAnswer } = await supabase
      .from('quiz_answers')
      .select('id')
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId)
      .maybeSingle()

    if (existingAnswer) {
      // Update existing answer
      const { error: updateError } = await supabase
        .from('quiz_answers')
        .update({
          option_id: selectedOptionId,
          is_correct: isCorrect,
        } as never)
        .eq('id', existingAnswer.id)

      if (updateError) throw updateError
    } else {
      // Create new answer
      const { error: insertError } = await supabase
        .from('quiz_answers')
        .insert({
          attempt_id: attemptId,
          question_id: questionId,
          option_id: selectedOptionId,
          is_correct: isCorrect,
        } as never)

      if (insertError) throw insertError
    }

    return {
      success: true,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to save quiz answer')
  }
}

