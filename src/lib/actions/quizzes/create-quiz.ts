'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { createQuizSchema } from '@/lib/validations/quiz.schema'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Create a new quiz with questions and options
 * 
 * @security Server-side only, protected by RLS, admin-only
 */
export async function createQuiz(formData: unknown) {
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
    const validatedData = createQuizSchema.parse(formData)

    // Get session to get class_id
    const { data: session } = await supabase
      .from('class_sessions')
      .select('class_id')
      .eq('id', validatedData.sessionId)
      .single()

    // Create quiz
    const typedSession = session as { class_id: string } | null
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        session_id: validatedData.sessionId,
        class_id: typedSession?.class_id,
        title: validatedData.title,
        description: validatedData.description,
        // Note: time_limit and passing_score don't exist in database
        created_by: user.id,
      } as never)
      .select()
      .single()

    if (quizError) throw quizError

    // Type assertion for quiz
    const typedQuiz = quiz as { id: string }

    // Create questions and options
    for (const question of validatedData.questions) {
      const { data: createdQuestion, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: typedQuiz.id,
          question_text: question.questionText,
          // Note: question_type and points don't exist in database
          order_index: question.orderNumber,
        } as never)
        .select()
        .single()

      if (questionError) throw questionError

      // Type assertion for createdQuestion
      const typedQuestion = createdQuestion as { id: string }

      // Create options if provided
      if (question.options && question.options.length > 0) {
        const optionsToInsert = question.options.map(option => ({
          question_id: typedQuestion.id,
          option_text: option.optionText,
          is_correct: option.isCorrect,
          order_index: option.orderNumber,
        }))

        const { error: optionsError } = await supabase
          .from('quiz_options')
          .insert(optionsToInsert as never)

        if (optionsError) throw optionsError
      }
    }

    // Revalidate paths
    if (typedSession) {
      revalidatePath(`/admin/classes/${typedSession.class_id}/sessions/${validatedData.sessionId}`)
      revalidatePath(`/admin/classes/${typedSession.class_id}/sessions/${validatedData.sessionId}/quizzes`)
    }

    return {
      success: true,
      data: quiz,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to create quiz')
  }
}

