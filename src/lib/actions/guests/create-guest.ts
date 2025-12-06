'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser, isAdmin } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createGuestSchema, type CreateGuestInput } from '@/lib/validations/guest.schema'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Create a guest account (admin-only)
 *
 * @security Server-side only, admin-only
 */
export async function createGuestAccount(input: unknown) {
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
    const validatedInput = createGuestSchema.parse(input) as CreateGuestInput

    // Check if a guest account with this phone already exists
    const supabase = await createClient()
    const { data: existingGuest } = await supabase
      .from('profiles')
      .select('id, is_guest')
      .eq('phone', validatedInput.phone)
      .eq('is_guest', true)
      .maybeSingle()

    if (existingGuest) {
      return {
        success: false,
        error: 'A guest account with this phone number already exists',
      }
    }

    // Use database function to create guest account (bypasses RLS and FK constraints)
    const { data: guestIdData, error: functionError } = await supabase
      .rpc('create_guest_account', {
        p_full_name: validatedInput.fullName,
        p_phone: validatedInput.phone,
        p_parent_phone_number: validatedInput.parentPhone,
      } as never)

    if (functionError) {
      throw functionError
    }

    const guestId = guestIdData as string

    // Fetch the created guest account
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', guestId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    // Revalidate relevant pages
    revalidatePath('/admin/guests')
    revalidatePath('/admin/students')

    return {
      success: true,
      data,
      message: 'Guest account created successfully',
    }
  } catch (error) {
    return handleServerError(error, 'Failed to create guest account')
  }
}

