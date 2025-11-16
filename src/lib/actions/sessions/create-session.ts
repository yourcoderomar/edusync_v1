'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, isAdmin, getUser } from '@/lib/supabase/server'
import { logError, getErrorMessage, ForbiddenError } from '@/lib/utils/errors'
import { createSessionSchema, type CreateSessionInput } from '@/lib/validations/session.schema'

/**
 * Create a new class session
 * 
 * @security Only accessible by authenticated admins
 */
export async function createSession(input: CreateSessionInput) {
  try {
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can create sessions')
    }

    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate input
    const validatedData = createSessionSchema.parse(input)

    const supabase = await createClient()

    // Create the session
    const { data, error } = await supabase
      .from('class_sessions')
      .insert({
        class_id: validatedData.classId,
        session_date: validatedData.sessionDate,
        starts_at: validatedData.startsAt || null,
        ends_at: validatedData.endsAt || null,
        created_by: user.id,
      } as never)
      .select()
      .single()

    if (error) {
      logError(error, 'createSession')
      return { success: false, error: 'Failed to create session' }
    }

    // Revalidate the sessions page
    revalidatePath(`/admin/classes/${validatedData.classId}/sessions`)
    
    // Return success without redirecting (let the form handle it)
    return { success: true, data }
  } catch (error) {
    // Re-throw redirect errors
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }

    logError(error, 'createSession')
    return { success: false, error: getErrorMessage(error) }
  }
}
