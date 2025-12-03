'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import {
  createAssignmentSchema,
  type CreateAssignmentInput,
} from '@/lib/validations/assignment.schema'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Create a new assignment in one of three modes:
 * - freeform: single instructions field
 * - structured: explicit questions/options
 * - bulk_mcq: grid-style A/B/C/D questions
 *
 * @security Server-side only, protected by RLS
 */
export async function createAssignment(input: unknown) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in.',
      }
    }

    // Validate input including mode
    const validated = createAssignmentSchema.parse(input) as CreateAssignmentInput

    // Get session to derive class_id for path revalidation
    const { data: session } = await supabase
      .from('class_sessions')
      .select('class_id')
      .eq('id', validated.sessionId)
      .single()

    const typedSession = session as { class_id: string } | null

    // Insert base assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        session_id: validated.sessionId,
        mode: validated.mode,
        title: validated.title,
        instructions:
          validated.mode === 'freeform'
            ? validated.instructions
            : 'instructions' in validated
            ? validated.instructions
            : null,
        due_at: validated.dueAt || null,
        max_points: validated.maxPoints ?? null,
        created_by: user.id,
      } as never)
      .select('id')
      .single()

    if (assignmentError) throw assignmentError
    const typedAssignment = assignment as { id: string } | null
    if (!typedAssignment) {
      throw new Error('Failed to create assignment')
    }

    // Mode-specific inserts
    if (validated.mode === 'structured') {
      // Insert questions
      for (const question of validated.questions) {
        const { data: createdQuestion, error: questionError } = await supabase
          .from('assignment_questions')
          .insert({
            assignment_id: typedAssignment.id,
            question_text: question.questionText,
            question_type: question.questionType,
            points: question.points,
            order_number: question.orderNumber,
          } as never)
          .select('id')
          .single()

        if (questionError) throw questionError
        const typedQuestion = createdQuestion as { id: string }

        if (question.options && question.options.length > 0) {
          const optionsToInsert = question.options.map((option) => ({
            question_id: typedQuestion.id,
            option_text: option.optionText,
            is_correct: option.isCorrect,
            order_number: option.orderNumber,
          }))

          const { error: optionsError } = await supabase
            .from('assignment_options')
            .insert(optionsToInsert as never)

          if (optionsError) throw optionsError
        }
      }
    } else if (validated.mode === 'bulk_mcq') {
      // Bulk MCQ: auto-generate generic question/option text and insert in batches
      const questionsToInsert = validated.rows.map((row, index) => ({
        assignment_id: typedAssignment.id,
        question_text: `Question ${index + 1}`,
        question_type: 'multiple_choice',
        points: row.points,
        order_number: index,
      }))

      const { data: createdQuestions, error: questionsError } = await supabase
        .from('assignment_questions')
        .insert(questionsToInsert as never)
        .select('id, order_number')

      if (questionsError) throw questionsError

      const questionsList = (createdQuestions || []) as Array<{
        id: string
        order_number: number
      }>

      const questionsMap = new Map<number, string>()
      for (const q of questionsList) {
        questionsMap.set(q.order_number, q.id)
      }

      const optionsToInsert: Array<{
        question_id: string
        option_text: string
        is_correct: boolean
        order_number: number
      }> = []

      validated.rows.forEach((row, index) => {
        const questionId = questionsMap.get(index)
        if (!questionId) return

        const correct = row.correctOption
        optionsToInsert.push(
          {
            question_id: questionId,
            option_text: 'Option A',
            is_correct: correct === 'A',
            order_number: 0,
          },
          {
            question_id: questionId,
            option_text: 'Option B',
            is_correct: correct === 'B',
            order_number: 1,
          },
          {
            question_id: questionId,
            option_text: 'Option C',
            is_correct: correct === 'C',
            order_number: 2,
          },
          {
            question_id: questionId,
            option_text: 'Option D',
            is_correct: correct === 'D',
            order_number: 3,
          }
        )
      })

      if (optionsToInsert.length > 0) {
        const { error: optionsError } = await supabase
          .from('assignment_options')
          .insert(optionsToInsert as never)

        if (optionsError) throw optionsError
      }
    }

    // Revalidate relevant paths
    if (typedSession) {
      revalidatePath(
        `/admin/classes/${typedSession.class_id}/sessions/${validated.sessionId}`
      )
      revalidatePath(
        `/admin/classes/${typedSession.class_id}/sessions/${validated.sessionId}/assignments`
      )
    }

    return {
      success: true,
      data: {
        id: typedAssignment.id,
      },
    }
  } catch (error) {
    return handleServerError(error, 'Failed to create assignment')
  }
}


