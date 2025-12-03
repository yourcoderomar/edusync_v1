'use server'

import { createClient } from '@/lib/supabase/server'
import { handleServerError, isRealError } from '@/lib/utils/errors'

/**
 * Get all assignments for a session
 *
 * @security Server-side only, protected by RLS
 */
export async function getAssignmentsBySession(sessionId: string) {
  try {
    const supabase = await createClient()

    const result = await supabase
      .from('assignments')
      .select('*')
      .eq('session_id', sessionId)
      .order('due_at', { ascending: true, nullsFirst: true })

    const assignments = result.data
    const error = result.error

    if (error && isRealError(error)) {
      console.error('Assignments fetch error:', error)
      throw error
    }

    if (!assignments || assignments.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    const assignmentsList = assignments as Array<{
      id: string
      created_by: string | null
      [key: string]: unknown
    }>

    const creatorIds = [
      ...new Set(assignmentsList.map((a) => a.created_by).filter(Boolean)),
    ] as string[]

    const creatorsResult =
      creatorIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', creatorIds)
        : { data: [] as any[] }

    const creators = (creatorsResult.data || []) as Array<{ id: string }>
    const creatorsMap = new Map(creators.map((c) => [c.id, c]))

    const withCreator = assignmentsList.map((assignment) => ({
      ...assignment,
      creator: assignment.created_by
        ? creatorsMap.get(assignment.created_by) || null
        : null,
    }))

    return {
      success: true,
      data: withCreator,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch assignments')
  }
}

/**
 * Get assignment by ID with questions and options (if applicable)
 *
 * @security Server-side only, protected by RLS
 */
export async function getAssignmentById(assignmentId: string) {
  try {
    const supabase = await createClient()

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()

    if (assignmentError && isRealError(assignmentError)) {
      console.error('Assignment fetch error:', assignmentError)
      throw assignmentError
    }

    if (!assignment) {
      throw new Error('Assignment not found')
    }

    const typedAssignment = assignment as { [key: string]: any; mode: string }

    // For freeform mode, no questions/options are needed
    if (typedAssignment.mode === 'freeform') {
      return {
        success: true,
        data: typedAssignment,
      }
    }

    // For structured and bulk_mcq, load questions and options
    const { data: questions, error: questionsError } = await supabase
      .from('assignment_questions')
      .select(
        `
        *,
        options:assignment_options(*)
      `
      )
      .eq('assignment_id', assignmentId)
      .order('order_number', { ascending: true })

    if (questionsError && isRealError(questionsError)) {
      throw questionsError
    }

    const questionsList = (questions || []) as Array<{
      [key: string]: any
      options?: Array<{ order_number: number }>
    }>

    const questionsWithSortedOptions = questionsList.map((question) => ({
      ...question,
      options:
        question.options?.sort(
          (a: any, b: any) => a.order_number - b.order_number
        ) || [],
    }))

    return {
      success: true,
      data: {
        ...typedAssignment,
        questions: questionsWithSortedOptions,
      },
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch assignment')
  }
}


