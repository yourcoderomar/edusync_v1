'use server'

import { revalidatePath } from 'next/cache'
import { createClient, isAdmin } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Delete a quiz (admin only)
 * 
 * @security Server-side only, protected by RLS, admin-only
 */
export async function deleteQuiz(quizId: string, sessionId: string, classId: string) {
  try {
    const supabase = await createClient()
    const userIsAdmin = await isAdmin()

    if (!userIsAdmin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      }
    }

    // Delete quiz (cascade will handle questions, options, and attempts)
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (error) throw error

    revalidatePath(`/admin/classes/${classId}/sessions/${sessionId}`)
    revalidatePath(`/admin/classes/${classId}/sessions/${sessionId}/quizzes`)

    return {
      success: true,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to delete quiz')
  }
}

