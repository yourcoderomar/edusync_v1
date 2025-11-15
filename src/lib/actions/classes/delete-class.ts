'use server'

import { revalidatePath } from 'next/cache'
import { createClient, isAdmin } from '@/lib/supabase/server'
import { deleteClassSchema, type DeleteClassInput } from '@/lib/validations/class.schema'
import { logError, getErrorMessage, ForbiddenError } from '@/lib/utils/errors'

/**
 * Delete a class
 * 
 * @security
 * - Only admins can delete classes
 * - Input validated with Zod
 * - Server-side authentication check
 */
export async function deleteClass(input: DeleteClassInput) {
  try {
    // Validate input
    const validatedInput = deleteClassSchema.parse(input)

    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can delete classes')
    }

    const supabase = await createClient()

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

