'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser, getUserProfile } from '@/lib/supabase/server'
import { createClassSchema, type CreateClassInput } from '@/lib/validations/class.schema'
import { logError, getErrorMessage, ForbiddenError } from '@/lib/utils/errors'

/**
 * Create a new class
 * 
 * @security
 * - Admins and instructors can create classes
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

    const profile = await getUserProfile()
    const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' } | null

    if (!typedProfile || (typedProfile.role !== 'admin' && typedProfile.role !== 'instructor')) {
      throw new ForbiddenError('You do not have permission to create classes')
    }

    const supabase = await createClient()

    let teacherId = user.id
    if (typedProfile.role === 'admin') {
      teacherId = validatedInput.teacherId || user.id

      if (teacherId !== user.id) {
        const { data: instructorProfile, error: instructorError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', teacherId)
          .in('role', ['instructor', 'admin'])
          .maybeSingle()

        if (instructorError || !instructorProfile) {
          return { success: false, error: 'Selected instructor not found or invalid' }
        }
      }
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: validatedInput.name,
        description: validatedInput.description,
        teacher_id: teacherId,
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

