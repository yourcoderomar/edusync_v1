'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Create instructor enrollment for the current student
 *
 * @security Server-side only, protected by RLS
 */
export async function createInstructorEnrollment(instructorId: string, passcode?: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Ensure target profile is an instructor and get passcode (if any)
    const { data: instructorProfile, error: instructorError } = await supabase
      .from('profiles')
      .select('id, role, enrollment_passcode')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructorProfile) {
      return { success: false, error: 'Instructor not found' }
    }

    const typedInstructorProfile = instructorProfile as {
      id: string
      role: 'admin' | 'instructor' | 'student'
      enrollment_passcode: string | null
    }

    if (typedInstructorProfile.role !== 'instructor') {
      return { success: false, error: 'Selected user is not an instructor' }
    }

    // If instructor has a passcode set, validate it
    if (typedInstructorProfile.enrollment_passcode) {
      if (!passcode) {
        return {
          success: false,
          error: 'A passcode is required to enroll with this instructor.',
        }
      }

      if (passcode !== typedInstructorProfile.enrollment_passcode) {
        return {
          success: false,
          error: 'Invalid passcode. Please check with your instructor and try again.',
        }
      }
    }

    // Check if already enrolled with this instructor
    const { data: existingEnrollment } = await supabase
      .from('instructor_enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('instructor_id', instructorId)
      .maybeSingle()

    const typedExistingEnrollment = existingEnrollment as {
      id: string
      status: 'pending' | 'approved' | 'rejected'
    } | null

    if (typedExistingEnrollment && typedExistingEnrollment.status === 'approved') {
      return { success: false, error: 'You are already enrolled with this instructor' }
    }

    // Create instructor enrollment (auto-approved for now)
    const { data, error } = await supabase
      .from('instructor_enrollments')
      .insert({
        student_id: user.id,
        instructor_id: instructorId,
        status: 'approved',
      } as never)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/student/instructors')
    revalidatePath('/student/dashboard')

    return {
      success: true,
      data,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to enroll with instructor')
  }
}




