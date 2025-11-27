'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser, isAdmin } from '@/lib/supabase/server'
import { adminEnrollStudentSchema, type AdminEnrollStudentInput } from '@/lib/validations/enrollment.schema'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Enroll a student into a class (admin-only)
 *
 * @security Server-side only, admin-only, respects RLS on enrollments
 */
export async function enrollStudentInClass(input: unknown) {
  try {
    const supabase = await createClient()
    const user = await getUser()
    const isUserAdmin = await isAdmin()

    if (!user || !isUserAdmin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      }
    }

    // Validate input
    const { studentId, classId } = adminEnrollStudentSchema.parse(input) as AdminEnrollStudentInput

    // Optional: ensure target user is a student
    const { data: studentProfile, error: studentError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', studentId)
      .single()

    if (studentError || !studentProfile) {
      return {
        success: false,
        error: 'Student not found',
      }
    }

    const typedStudentProfile = studentProfile as { id: string; role: 'admin' | 'instructor' | 'student' }

    if (typedStudentProfile.role !== 'student') {
      return {
        success: false,
        error: 'Only student accounts can be enrolled into classes',
      }
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('user_id', studentId)
      .maybeSingle()

    if (existingEnrollment) {
      return {
        success: false,
        error: 'This student is already enrolled in the selected class',
      }
    }

    // Create enrollment
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        class_id: classId,
        user_id: studentId,
      } as never)

    if (enrollmentError) {
      throw enrollmentError
    }

    // Ensure instructor_enrollments has a record linking this student and the class instructor
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    const typedClassData = classData as { teacher_id: string | null } | null

    if (!classError && typedClassData && typedClassData.teacher_id) {
      const teacherId = typedClassData.teacher_id

      const { data: existingInstructorEnrollment } = await supabase
        .from('instructor_enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('instructor_id', teacherId)
        .maybeSingle()

      if (!existingInstructorEnrollment) {
        await supabase
          .from('instructor_enrollments')
          .insert({
            student_id: studentId,
            instructor_id: teacherId,
            status: 'approved',
          } as never)
      }
    }

    // Revalidate relevant pages
    revalidatePath(`/admin/students/${studentId}`)
    revalidatePath(`/admin/classes/${classId}/students`)

    return {
      success: true,
      message: 'Student enrolled successfully',
    }
  } catch (error) {
    return handleServerError(error, 'Failed to enroll student into class')
  }
}


