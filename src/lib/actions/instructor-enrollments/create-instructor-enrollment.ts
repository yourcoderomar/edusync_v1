'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Create instructor enrollment for the current student
 *
 * @security Server-side only, protected by RLS
 */
export async function createInstructorEnrollment(instructorId: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Ensure target profile is an instructor
    const { data: instructorProfile, error: instructorError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructorProfile) {
      return { success: false, error: 'Instructor not found' }
    }

    if (instructorProfile.role !== 'instructor') {
      return { success: false, error: 'Selected user is not an instructor' }
    }

    // Check if already enrolled with this instructor
    const { data: existingEnrollment } = await supabase
      .from('instructor_enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('instructor_id', instructorId)
      .maybeSingle()

    if (existingEnrollment && existingEnrollment.status === 'approved') {
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


