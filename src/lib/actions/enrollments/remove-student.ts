'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser, getUserProfile, isAdminOrInstructor } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'
import { z } from 'zod'

/**
 * Schema for removing a student from a class
 */
const removeStudentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  classId: z.string().uuid('Invalid class ID'),
})

type RemoveStudentInput = z.infer<typeof removeStudentSchema>

/**
 * Remove a student from a class (admin or instructor)
 *
 * @security Server-side only, admin or instructor access required, respects RLS
 */
export async function removeStudentFromClass(input: unknown) {
  try {
    const supabase = await createClient()
    const user = await getUser()
    const canManage = await isAdminOrInstructor()

    if (!user || !canManage) {
      return {
        success: false,
        error: 'Unauthorized. Admin or instructor access required.',
      }
    }

    // Validate input
    const { studentId, classId } = removeStudentSchema.parse(input) as RemoveStudentInput

    // If user is instructor, verify they own this class
    const profile = await getUserProfile()
    if (profile) {
      const typedProfile = profile as { id: string; role: 'admin' | 'instructor' | 'student' }

      if (typedProfile.role === 'instructor') {
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('teacher_id')
          .eq('id', classId)
          .single()

        if (classError || !classData) {
          return {
            success: false,
            error: 'Class not found',
          }
        }

        const typedClassData = classData as { teacher_id: string | null }

        if (typedClassData.teacher_id !== typedProfile.id) {
          return {
            success: false,
            error: 'Unauthorized. You can only remove students from your own classes.',
          }
        }
      }
    }

    // Check if enrollment exists
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('class_id, user_id')
      .eq('class_id', classId)
      .eq('user_id', studentId)
      .maybeSingle()

    if (enrollmentError) {
      throw enrollmentError
    }

    if (!enrollment) {
      return {
        success: false,
        error: 'Student is not enrolled in this class',
      }
    }

    // Delete the enrollment using composite key (class_id, user_id)
    const { error: deleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('class_id', classId)
      .eq('user_id', studentId)

    if (deleteError) {
      throw deleteError
    }

    // Revalidate relevant pages
    revalidatePath(`/admin/students/${studentId}`)
    revalidatePath(`/admin/classes/${classId}/students`)
    revalidatePath(`/admin/classes/${classId}`)

    return {
      success: true,
      message: 'Student removed from class successfully',
    }
  } catch (error) {
    return handleServerError(error, 'Failed to remove student from class')
  }
}

