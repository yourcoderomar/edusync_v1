'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Delete an assignment and its related questions/options/submissions.
 *
 * @security Relying on RLS: only admins/instructors for the class can delete.
 */
export async function deleteAssignment(params: {
  assignmentId: string
  classId: string
  sessionId: string
}) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in.',
      }
    }

    const { assignmentId, classId, sessionId } = params

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      throw error
    }

    revalidatePath(
      `/admin/classes/${classId}/sessions/${sessionId}/assignments`
    )

    return { success: true }
  } catch (error) {
    return handleServerError(error, 'Failed to delete assignment')
  }
}





