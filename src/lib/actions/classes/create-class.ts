'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser, isAdmin } from '@/lib/supabase/server'
import { createClassSchema, type CreateClassInput } from '@/lib/validations/class.schema'
import { logError, getErrorMessage, ForbiddenError } from '@/lib/utils/errors'

/**
 * Create a new class
 * 
 * @security
 * - Only admins can create classes
 * - Input validated with Zod
 * - Server-side authentication check
 */
export async function createClass(input: CreateClassInput) {
  try {
    // Validate input
    const validatedInput = createClassSchema.parse(input)

    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can create classes')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: validatedInput.name,
        description: validatedInput.description,
        teacher_id: user.id,
      } as never)
      .select()
      .single()

    if (error) {
      logError(error, 'createClass')
      return { success: false, error: 'Failed to create class' }
    }

    revalidatePath('/admin/classes')
    revalidatePath('/admin/dashboard')

    return { success: true, data }
  } catch (error) {
    logError(error, 'createClass')
    return { success: false, error: getErrorMessage(error) }
  }
}

