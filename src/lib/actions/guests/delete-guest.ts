'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser, isAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
import { handleServerError } from '@/lib/utils/errors'

const deleteGuestSchema = z.object({
  guestId: z.string().uuid('Invalid guest ID'),
})

/**
 * Delete a guest account (admin-only)
 *
 * @security Server-side only, admin-only
 * Note: Enrollments and instructor_enrollments will be deleted via CASCADE
 */
export async function deleteGuestAccount(input: unknown) {
  try {
    const user = await getUser()
    const isUserAdmin = await isAdmin()

    if (!user || !isUserAdmin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      }
    }

    // Validate input
    const { guestId } = deleteGuestSchema.parse(input)

    const supabase = await createClient()

    // Verify it's a guest account
    const { data: guest, error: guestError } = await supabase
      .from('profiles')
      .select('id, is_guest')
      .eq('id', guestId)
      .eq('is_guest', true)
      .single()

    if (guestError || !guest) {
      return {
        success: false,
        error: 'Guest account not found',
      }
    }

    // Delete guest account (enrollments will cascade)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', guestId)
      .eq('is_guest', true)

    if (deleteError) {
      throw deleteError
    }

    // Revalidate relevant pages
    revalidatePath('/admin/guests')
    revalidatePath('/admin/students')

    return {
      success: true,
      message: 'Guest account deleted successfully',
    }
  } catch (error) {
    return handleServerError(error, 'Failed to delete guest account')
  }
}



