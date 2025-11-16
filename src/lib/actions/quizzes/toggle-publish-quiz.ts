'use server'

import { revalidatePath } from 'next/cache'
import { createClient, isAdmin } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Toggle quiz publish status (admin only)
 * 
 * @security Server-side only, protected by RLS, admin-only
 */
export async function togglePublishQuiz(quizId: string, classId?: string, sessionId?: string) {
  try {
    const supabase = await createClient()
    const userIsAdmin = await isAdmin()

    if (!userIsAdmin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      }
    }

    // Get current quiz to check current publish status
    const { data: quiz, error: fetchError } = await supabase
      .from('quizzes')
      .select('is_published, class_id, session_id')
      .eq('id', quizId)
      .single()

    if (fetchError) {
      return {
        success: false,
        error: 'Failed to fetch quiz',
      }
    }

    if (!quiz) {
      return {
        success: false,
        error: 'Quiz not found',
      }
    }

    // Toggle publish status
    const newPublishStatus = !quiz.is_published

    const { error: updateError } = await supabase
      .from('quizzes')
      .update({ is_published: newPublishStatus })
      .eq('id', quizId)

    if (updateError) {
      return {
        success: false,
        error: 'Failed to update quiz publish status',
      }
    }

    // Revalidate relevant paths
    if (sessionId && classId) {
      revalidatePath(`/admin/classes/${classId}/sessions/${sessionId}/quizzes`)
      revalidatePath(`/admin/classes/${classId}/sessions/${sessionId}/quizzes/${quizId}`)
    }
    if (classId) {
      revalidatePath(`/admin/classes/${classId}/quizzes`)
      revalidatePath(`/admin/classes/${classId}`)
    }
    revalidatePath(`/student/classes/${classId}`)
    if (sessionId) {
      revalidatePath(`/student/classes/${classId}/sessions/${sessionId}`)
    }

    return {
      success: true,
      data: {
        is_published: newPublishStatus,
      },
    }
  } catch (error) {
    return handleServerError(error, 'Failed to toggle quiz publish status')
  }
}

