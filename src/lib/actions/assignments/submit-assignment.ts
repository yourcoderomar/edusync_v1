'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { submitAssignmentSchema } from '@/lib/validations/assignment.schema'
import {
  gradeBulkMcq,
  type McqQuestionForGrading,
} from '@/lib/assignments/grading'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Submit an assignment (single content field for now).
 *
 * @security Server-side only, protected by RLS
 */
export async function submitAssignment(input: unknown) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in.',
      }
    }

    const { assignmentId, content, answers } = submitAssignmentSchema.parse(
      input
    )

    // Get assignment/session/class for path revalidation and grading context
    const { data: assignment } = await supabase
      .from('assignments')
      .select(
        `
        id,
        mode,
        max_points,
        session_id,
        session:class_sessions!assignments_session_id_fkey(id, class_id)
      `
      )
      .eq('id', assignmentId)
      .single()

    if (!assignment) {
      return {
        success: false,
        error: 'Assignment not found',
      }
    }

    const typedAssignment = assignment as {
      id: string
      mode: 'freeform' | 'structured' | 'bulk_mcq'
      max_points: number | null
      session_id: string
      session: { id: string; class_id: string }
    }

    let grade: number | null = null
    let storedContent: string | null =
      content && content.trim().length > 0 ? content.trim() : null

    // Auto-grade bulk_mcq assignments using provided answers
    if (typedAssignment.mode === 'bulk_mcq' && Array.isArray(answers)) {
      const { data: questionsData } = await supabase
        .from('assignment_questions')
        .select(
          `
          id,
          points,
          options:assignment_options (
            id,
            is_correct
          )
        `
        )
        .eq('assignment_id', assignmentId)

      const questions = (questionsData || []) as McqQuestionForGrading[]

      const { totalEarned, totalPossible } = gradeBulkMcq(questions, answers)

      // Avoid division by zero; store raw points as grade
      grade = totalPossible > 0 ? totalEarned : 0

      // Persist a compact JSON representation of answers for audit/debugging
      storedContent = JSON.stringify({
        type: 'bulk_mcq_answers',
        answers: answers.map((a) => ({
          q: a.questionId,
          o: a.selectedOptionId,
        })),
        totalEarned,
        totalPossible,
      })
    }

    // Upsert submission for this student/assignment
    const { error: submissionError } = await supabase
      .from('assignment_submissions')
      .upsert(
        {
          assignment_id: assignmentId,
          student_id: user.id,
          content: storedContent,
          grade,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never,
        {
          onConflict: 'assignment_id,student_id',
        } as never
      )

    if (submissionError) throw submissionError

    // Revalidate student and instructor views
    const classId = typedAssignment.session.class_id
    const sessionId = typedAssignment.session_id

    revalidatePath(
      `/student/classes/${classId}/sessions/${sessionId}/assignments`
    )
    revalidatePath(
      `/student/classes/${classId}/sessions/${sessionId}/assignments/${assignmentId}`
    )
    revalidatePath(
      `/admin/classes/${classId}/sessions/${sessionId}/assignments/${assignmentId}`
    )

    return {
      success: true,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to submit assignment')
  }
}


