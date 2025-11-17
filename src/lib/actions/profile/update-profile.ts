'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { profileUpdateSchema } from '@/lib/validations/profile.schema'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Update profile information server action
 * 
 * @security
 * - Validates user authentication
 * - Uses authenticated client (respects RLS policies)
 * - RLS allows users to update their own profile
 */
export async function updateProfile(input: {
  fullName?: string
  phone?: string
  parentPhone?: string
}) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'You must be logged in to update your profile',
      }
    }

    // Validate input
    const validatedInput = profileUpdateSchema.parse(input)

    // Build update payload (only include fields that are provided)
    const updatePayload: {
      full_name?: string
      phone?: string
      parent_phone_number?: string
    } = {}

    if (validatedInput.fullName !== undefined) {
      updatePayload.full_name = validatedInput.fullName
    }
    if (validatedInput.phone !== undefined) {
      updatePayload.phone = validatedInput.phone
    }
    if (validatedInput.parentPhone !== undefined) {
      updatePayload.parent_phone_number = validatedInput.parentPhone
    }

    // Update profile using authenticated client (RLS allows users to update their own profile)
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload as never)
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Failed to update profile:', updateError)
      return {
        success: false,
        error: `Failed to update profile: ${updateError.message || 'Unknown error'}`,
      }
    }

    // Revalidate the profile page
    revalidatePath('/profile', 'page')

    return {
      success: true,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to update profile')
  }
}


