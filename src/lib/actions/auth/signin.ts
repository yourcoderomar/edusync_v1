'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signInSchema, type SignInInput } from '@/lib/validations/auth.schema'
import { getErrorMessage, logError } from '@/lib/utils/errors'

/**
 * Sign in server action
 * 
 * @security
 * - Validates input with Zod
 * - Uses Supabase auth
 * - Sets secure HTTP-only cookies
 * - Never exposes sensitive data
 */
export async function signIn(input: SignInInput) {
  try {
    // Validate input
    const validatedInput = signInSchema.parse(input)

    const supabase = await createClient()

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedInput.email,
      password: validatedInput.password,
    })

    if (error) {
      logError(error, 'signIn - auth error')
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Authentication failed',
      }
    }

    // Get user profile to determine redirect
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, profile_picture_url')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      logError(profileError, 'signIn - profile fetch error')
      console.error('Profile error details:', profileError)
      return {
        success: false,
        error: 'Could not fetch user profile. Please try again.',
      }
    }

    if (!profile) {
      return {
        success: false,
        error: 'User profile not found. Please contact support.',
      }
    }

    // Revalidate and redirect
    revalidatePath('/', 'layout')
    
    // Type assertion: profile exists after null check
    const typedProfile = profile as { role: 'admin' | 'student'; profile_picture_url: string | null }
    
    // Check if profile picture is missing - redirect to setup
    if (!typedProfile.profile_picture_url) {
      redirect('/profile/setup')
    }
    
    // If redirectTo is provided and valid, use it (for attendance scan flow)
    if (validatedInput.redirectTo) {
      // Validate that redirectTo is a safe path (starts with /)
      const redirectPath = validatedInput.redirectTo
      if (redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
        redirect(redirectPath)
      }
    }
    
    // Default redirect based on role
    const redirectPath = typedProfile.role === 'admin' 
      ? '/admin/dashboard' 
      : '/student/dashboard'
    
    redirect(redirectPath)
  } catch (error) {
    // redirect() throws a special error that should not be caught
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    
    logError(error, 'signIn')
    console.error('Sign in error:', error)
    
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

