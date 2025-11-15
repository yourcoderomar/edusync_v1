'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth.schema'
import { getErrorMessage, logError } from '@/lib/utils/errors'

/**
 * Sign up server action
 * 
 * @security
 * - Validates input with Zod
 * - Creates auth user and profile in transaction-like manner
 * - Uses Supabase auth
 * - Sets secure HTTP-only cookies
 */
export async function signUp(input: SignUpInput) {
  try {
    // Validate input
    const validatedInput = signUpSchema.parse(input)

    const supabase = await createClient()

    // Sign up with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedInput.email,
      password: validatedInput.password,
      options: {
        data: {
          full_name: validatedInput.fullName,
          role: validatedInput.role,
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

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: validatedInput.email,
        full_name: validatedInput.fullName,
        role: validatedInput.role,
      })

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      // but Supabase doesn't provide a way to delete users from client
      logError(profileError, 'signUp - profile creation')
      
      return {
        success: false,
        error: 'Failed to create profile. Please contact support.',
      }
    }

    // Revalidate and redirect
    revalidatePath('/', 'layout')
    
    const redirectPath = validatedInput.role === 'admin' 
      ? '/admin/dashboard' 
      : '/student/dashboard'
    
    redirect(redirectPath)
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

