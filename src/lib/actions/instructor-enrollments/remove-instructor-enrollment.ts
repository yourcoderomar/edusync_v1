'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser, getUserProfile, isAdminOrInstructor } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'
import { z } from 'zod'

/**
 * Schema for removing an instructor enrollment
 */
const removeInstructorEnrollmentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  instructorId: z.string().uuid('Invalid instructor ID'),
})

type RemoveInstructorEnrollmentInput = z.infer<typeof removeInstructorEnrollmentSchema>

/**
 * Remove an instructor enrollment (admin, instructor, or student themselves)
 *
 * @security Server-side only, respects RLS
 */
export async function removeInstructorEnrollment(input: unknown) {
  try {
    const supabase = await createClient()
    const user = await getUser()
    const profile = await getUserProfile()

    if (!user || !profile) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Validate input
    const { studentId, instructorId } = removeInstructorEnrollmentSchema.parse(input) as RemoveInstructorEnrollmentInput

    const typedProfile = profile as { id: string; role: 'admin' | 'instructor' | 'student' }

    // Students can only remove their own instructor enrollments
    if (typedProfile.role === 'student') {
      if (typedProfile.id !== studentId) {
        return {
          success: false,
          error: 'You can only remove your own instructor enrollments',
        }
      }
    }

    // Instructors can only remove enrollments where they are the instructor
    if (typedProfile.role === 'instructor') {
      if (typedProfile.id !== instructorId) {
        return {
          success: false,
          error: 'You can only remove enrollments for your own students',
        }
      }
    }

    // Admins can remove any enrollment
    // For instructors, we already verified they are the instructor
    // For students, we already verified they are the student

    // Check if enrollment exists
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('instructor_enrollments')
      .select('id, student_id, instructor_id, status')
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId)
      .maybeSingle()

    if (enrollmentError) {
      throw enrollmentError
    }

    if (!enrollment) {
      return {
        success: false,
        error: 'Instructor enrollment not found',
      }
    }

    // Get all classes taught by this instructor
    const { data: instructorClasses, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', instructorId)

    if (classesError) {
      throw classesError
    }

    // Delete all class enrollments for this student in classes taught by this instructor
    if (instructorClasses && instructorClasses.length > 0) {
      const classIds = instructorClasses.map((c: { id: string }) => c.id)
      
      const { data: deletedEnrollments, error: deleteEnrollmentsError } = await supabase
        .from('enrollments')
        .delete()
        .eq('user_id', studentId)
        .in('class_id', classIds)
        .select()

      if (deleteEnrollmentsError) {
        console.error('Error deleting class enrollments:', deleteEnrollmentsError)
        throw deleteEnrollmentsError
      }
      
      console.log(`Deleted ${deletedEnrollments?.length || 0} class enrollments for student ${studentId}`)
    }

    // Delete the instructor enrollment
    const { data: deletedInstructorEnrollment, error: deleteError } = await supabase
      .from('instructor_enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId)
      .select('id')

    if (deleteError) {
      console.error('Error deleting instructor enrollment:', deleteError)
      throw deleteError
    }

    if (!deletedInstructorEnrollment || deletedInstructorEnrollment.length === 0) {
      console.warn(`No instructor enrollment found to delete for student ${studentId} and instructor ${instructorId}`)
      return {
        success: false,
        error: 'Instructor enrollment not found or already deleted',
      }
    }

    const deletedEnrollment = deletedInstructorEnrollment[0] as { id: string }
    console.log(`Successfully deleted instructor enrollment: ${deletedEnrollment.id}`)

    // Revalidate relevant pages
    revalidatePath(`/admin/students/${studentId}`)
    revalidatePath(`/admin/students`)
    revalidatePath(`/admin/dashboard`)
    revalidatePath(`/student/dashboard`)
    revalidatePath(`/student/instructors`)
    revalidatePath(`/student/instructors/${instructorId}`)
    revalidatePath(`/student/my-learning`)
    revalidatePath(`/instructor/dashboard`)

    return {
      success: true,
      message: 'Instructor enrollment and related class enrollments removed successfully',
    }
  } catch (error) {
    return handleServerError(error, 'Failed to remove instructor enrollment')
  }
}

