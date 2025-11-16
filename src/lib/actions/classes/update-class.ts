'use server'

import { revalidatePath } from 'next/cache'
import { createClient, isAdmin } from '@/lib/supabase/server'
import { updateClassSchema, type UpdateClassInput } from '@/lib/validations/class.schema'
import { logError, getErrorMessage, ForbiddenError } from '@/lib/utils/errors'

/**
 * Update an existing class
 * 
 * @security
 * - Only admins can update classes
 * - Input validated with Zod
 * - Server-side authentication check
 */
export async function updateClass(input: UpdateClassInput) {
  try {
    // Validate input
    const validatedInput = updateClassSchema.parse(input)

    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can update classes')
    }

    const supabase = await createClient()

    const updateData: any = {}
    if (validatedInput.name !== undefined) updateData.name = validatedInput.name
    if (validatedInput.description !== undefined) updateData.description = validatedInput.description
    updateData.updated_at = new Date().toISOString()

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

