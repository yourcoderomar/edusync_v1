'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signUpSchema } from '@/lib/validations/auth.schema'
import { getErrorMessage, logError } from '@/lib/utils/errors'

/**
 * Sign up server action
 * 
 * @security
 * - Validates input with Zod
 * - Creates auth user and profile via database trigger
 * - Uses Supabase auth
 * - Sets secure HTTP-only cookies
 */
export async function signUp(formData: FormData) {
  try {
    // Extract form data
    const input = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('password') as string, // For validation
      fullName: formData.get('fullName') as string,
      phoneCountryCode: formData.get('phoneCountryCode') as string,
      phone: formData.get('phone') as string,
      parentPhoneCountryCode: formData.get('parentPhoneCountryCode') as string,
      parentPhone: formData.get('parentPhone') as string,
    }

    // Debug log to see what we're receiving
    console.log('📥 Sign up form data:', {
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      parentPhone: input.parentPhone,
    })

    // Validate input
    const validatedInput = signUpSchema.parse(input)

    const supabase = await createClient()

    // Sign up with Supabase (all users are students by default)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedInput.email,
      password: validatedInput.password,
      options: {
        data: {
          full_name: validatedInput.fullName,
          phone: validatedInput.phone,
          parent_phone_number: validatedInput.parentPhone,
          role: 'student',
        },
      },
    })

    if (authError) {
      return {
        success: false,
        error: authError.message || 'Failed to create account',
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create account',
      }
    }

    // Profile is now created automatically by database trigger
    console.log('✅ Profile created automatically by database trigger for user:', authData.user.id)

    // Check for existing guest account with matching phone number
    const { data: guestAccount } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', validatedInput.phone)
      .eq('is_guest', true)
      .maybeSingle()

    if (guestAccount) {
      const guestId = (guestAccount as { id: string }).id
      const newUserId = authData.user.id

      console.log(`🔄 Found guest account ${guestId}, transferring enrollments to new user ${newUserId}`)

      // Transfer enrollments from guest to new user
      const { error: enrollmentsError } = await supabase
        .from('enrollments')
        .update({ user_id: newUserId } as never)
        .eq('user_id', guestId)

      if (enrollmentsError) {
        console.error('Error transferring enrollments:', enrollmentsError)
        // Continue anyway - enrollments transfer failed but user is created
      }

      // Transfer instructor enrollments from guest to new user
      const { error: instructorEnrollmentsError } = await supabase
        .from('instructor_enrollments')
        .update({ student_id: newUserId } as never)
        .eq('student_id', guestId)

      if (instructorEnrollmentsError) {
        console.error('Error transferring instructor enrollments:', instructorEnrollmentsError)
        // Continue anyway - instructor enrollments transfer failed but user is created
      }

      // Delete guest account after transferring enrollments
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', guestId)
        .eq('is_guest', true)

      if (deleteError) {
        console.error('Error deleting guest account:', deleteError)
        // Continue anyway - guest account deletion failed but user is created
      } else {
        console.log(`✅ Guest account ${guestId} deleted after transferring enrollments`)
      }
    }

    // Revalidate and redirect to student dashboard
    revalidatePath('/', 'layout')
    redirect('/student/dashboard')
  } catch (error) {
    // redirect() throws a special error that should not be caught
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    
    logError(error, 'signUp')
    console.error('Sign up error:', error)
    
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

