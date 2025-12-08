'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import {
  updateAssignmentSchema,
  type UpdateAssignmentInput,
} from '@/lib/validations/assignment.schema'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Update basic assignment fields (title, instructions, dueAt, maxPoints).
 *
 * @security RLS ensures only admins/instructors for the class can update.
 */
export async function updateAssignment(
  input: UpdateAssignmentInput & { classId: string; sessionId: string }
) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in.',
      }
    }

    const { classId, sessionId, ...rest } = input

    const validated = updateAssignmentSchema.parse(rest)

    const updates: Record<string, unknown> = {}
    if (validated.title !== undefined) updates.title = validated.title
    if (validated.instructions !== undefined)
      updates.instructions = validated.instructions
    if (validated.dueAt !== undefined) updates.due_at = validated.dueAt
    if (validated.maxPoints !== undefined)
      updates.max_points = validated.maxPoints

    if (Object.keys(updates).length === 0) {
      return { success: true }
    }

    const { error } = await supabase
      .from('assignments')
      .update(updates as never)
      .eq('id', validated.id)

    if (error) throw error

    revalidatePath(
      `/admin/classes/${classId}/sessions/${sessionId}/assignments`
    )
    revalidatePath(
      `/admin/classes/${classId}/sessions/${sessionId}/assignments/${validated.id}`
    )

    return { success: true }
  } catch (error) {
    return handleServerError(error, 'Failed to update assignment')
  }
}







