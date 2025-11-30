'use server'

import { revalidatePath } from 'next/cache'
import { createClient, isAdminOrInstructor, getUserProfile } from '@/lib/supabase/server'
import { updateClassSchema, type UpdateClassInput } from '@/lib/validations/class.schema'
import { logError, getErrorMessage, ForbiddenError } from '@/lib/utils/errors'

/**
 * Update an existing class
 * 
 * @security
 * - Admins can update all classes
 * - Instructors can only update their own classes
 * - Input validated with Zod
 * - Server-side authentication check
 */
export async function updateClass(input: UpdateClassInput) {
  try {
    // Validate input
    const validatedInput = updateClassSchema.parse(input)

    const canManageClasses = await isAdminOrInstructor()
    if (!canManageClasses) {
      throw new ForbiddenError('Only admins or instructors can update classes')
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
        logError(fetchError || new Error('Class not found'), 'updateClass')
        return { success: false, error: 'Class not found' }
      }

      // Check if instructor owns this class
      const typedClassData = classData as { teacher_id: string }
      if (typedClassData.teacher_id !== typedProfile.id) {
        throw new ForbiddenError('You can only update your own classes')
      }
    }

    const updateData: any = {}
    if (validatedInput.name !== undefined) updateData.name = validatedInput.name
    if (validatedInput.description !== undefined) updateData.description = validatedInput.description

    const { data, error } = await supabase
      .from('classes')
      .update(updateData as never)
      .eq('id', validatedInput.id)
      .select()
      .single()

    if (error) {
      logError(error, 'updateClass')
      return { success: false, error: 'Failed to update class' }
    }

    revalidatePath('/admin/classes')
    revalidatePath(`/admin/classes/${validatedInput.id}`)
    revalidatePath('/admin/dashboard')

    return { success: true, data }
  } catch (error) {
    logError(error, 'updateClass')
    return { success: false, error: getErrorMessage(error) }
  }
}

