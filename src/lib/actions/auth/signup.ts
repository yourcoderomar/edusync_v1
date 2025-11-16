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
      phone: formData.get('phone') as string,
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

