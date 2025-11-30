'use server'

import { revalidatePath } from 'next/cache'
import { createClient, isAdminOrInstructor, isAdmin, getUserProfile } from '@/lib/supabase/server'
import { deleteClassSchema, type DeleteClassInput } from '@/lib/validations/class.schema'
import { logError, getErrorMessage, ForbiddenError } from '@/lib/utils/errors'

/**
 * Delete a class
 * 
 * @security
 * - Admins can delete all classes
 * - Instructors can only delete their own classes
 * - Input validated with Zod
 * - Server-side authentication check
 */
export async function deleteClass(input: DeleteClassInput) {
  try {
    // Validate input
    const validatedInput = deleteClassSchema.parse(input)

    const canManageClasses = await isAdminOrInstructor()
    if (!canManageClasses) {
      throw new ForbiddenError('Only admins or instructors can delete classes')
    }

    const supabase = await createClient()
    const profile = await getUserProfile()
    const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' } | null

    if (!typedProfile) {
      throw new ForbiddenError('User profile not found')
    }

    // If instructor, check if they own the class
    if (typedProfile.role === 'instructor') {
      const { data: classData, error: fetchError } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', validatedInput.id)
        .single()

      if (fetchError || !classData) {
        logError(fetchError || new Error('Class not found'), 'deleteClass')
        return { success: false, error: 'Class not found' }
      }

      // Check if instructor owns this class
      const typedClassData = classData as { teacher_id: string }
      if (typedClassData.teacher_id !== typedProfile.id) {
        throw new ForbiddenError('You can only delete your own classes')
      }
    }

    // Delete the class (RLS will also enforce permissions)
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', validatedInput.id)

    if (error) {
      logError(error, 'deleteClass')
      return { success: false, error: 'Failed to delete class' }
    }

    revalidatePath('/admin/classes')
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (error) {
    logError(error, 'deleteClass')
    return { success: false, error: getErrorMessage(error) }
  }
}

