'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser, isAdminOrInstructor } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'
import { createNotification } from '@/lib/actions/notifications/create-notification'

/**
 * Create enrollment request (student)
 * 
 * @security Server-side only, protected by RLS
 */
export async function createEnrollmentRequest(classId: string, notes?: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }


    // Get class to determine instructor
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, teacher_id')
      .eq('id', classId)
      .single()

    if (classError) {
      return { 
        success: false, 
        error: classError.code === 'PGRST116' ? 'Class not found' : 'Error looking up class. Please try again.' 
      }
    }

    if (!classData) {
      return { success: false, error: 'Class not found' }
    }

    const typedClassData = classData as { id: string; teacher_id: string | null }

    if (!typedClassData.teacher_id) {
      return { success: false, error: 'This class has no instructor assigned yet. Please contact support.' }
    }

    // Ensure student is connected with this instructor first:
    // either via an approved instructor_enrollment OR an existing class enrollment
    const { data: instructorEnrollment } = await supabase
      .from('instructor_enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('instructor_id', typedClassData.teacher_id)
      .eq('status', 'approved')
      .maybeSingle()

    if (!instructorEnrollment) {
      // Fallback: check if student is already enrolled in ANY class with this instructor
      const { data: instructorClasses, error: instructorClassesError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', typedClassData.teacher_id)

      if (!instructorClassesError && instructorClasses && instructorClasses.length > 0) {
        const classIds = instructorClasses.map(c => (c as { id: string }).id)

        const { data: existingInstructorClassEnrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .in('class_id', classIds)
          .maybeSingle()

        if (!existingInstructorClassEnrollment) {
          return {
            success: false,
            error: 'You must enroll with this instructor before requesting enrollment in their class.',
          }
        }
      } else {
        return {
          success: false,
          error: 'You must enroll with this instructor before requesting enrollment in their class.',
        }
      }
    }

    // Check if already enrolled
    const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('class_id', classId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (enrollmentCheckError && enrollmentCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected, other errors are real issues
      return { success: false, error: 'Error checking enrollment status. Please try again.' }
    }

    if (existingEnrollment) {
      return { success: false, error: 'You are already enrolled in this class' }
    }

    // Check if already has pending request
    const { data: existingRequestRaw } = await supabase
      .from('enrollment_requests')
      .select('id, status')
      .eq('class_id', classId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Type assertion to help TypeScript understand the request type
    const existingRequest = existingRequestRaw as { id: string; status: string } | null

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return { success: false, error: 'You already have a pending request for this class' }
      }
      // If there's a rejected request, delete it so they can create a new one
      // (Due to UNIQUE constraint on class_id + user_id)
      if (existingRequest.status === 'rejected') {
        const { error: deleteError } = await supabase
          .from('enrollment_requests')
          .delete()
          .eq('id', existingRequest.id)
        
        if (deleteError) {
          return { success: false, error: 'Error cleaning up previous request. Please try again.' }
        }
      }
    }

    // Note: Rejected requests are deleted when rejected, so students can re-apply

    // Create request
    const { data, error } = await supabase
      .from('enrollment_requests')
      .insert({
        class_id: classId,
        user_id: user.id,
        notes: notes || null,
        status: 'pending',
      } as never)
      .select()
      .single()

    if (error) {
      // Return more specific error message
      if (error.code === '23505') {
        return { success: false, error: 'You already have a request for this class' }
      }
      if (error.code === '23503') {
        return { success: false, error: 'Invalid class or user reference' }
      }
      throw error
    }

    if (!data) {
      return { success: false, error: 'Failed to create enrollment request. Please try again.' }
    }

    revalidatePath('/admin/enrollment-requests')
    revalidatePath('/student/my-learning')

    return {
      success: true,
      data,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to create enrollment request')
  }
}

/**
 * Approve enrollment request (admin)
 * 
 * @security Server-side only, admin-only
 */
export async function approveEnrollmentRequest(requestId: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()
    const canManageRequests = await isAdminOrInstructor()

    if (!user || !canManageRequests) {
      return { success: false, error: 'Unauthorized. Admin or instructor access required.' }
    }

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('enrollment_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError) throw requestError

    const typedRequest = request as { id: string; status: string; class_id: string; user_id: string; [key: string]: any }
    if (typedRequest.status !== 'pending') {
      return { success: false, error: 'This request has already been processed' }
    }

    // Create enrollment
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        class_id: typedRequest.class_id,
        user_id: typedRequest.user_id,
      } as never)

    if (enrollmentError) throw enrollmentError

    // Ensure instructor_enrollments has a record linking this student and the class instructor
    // Also get class name for notification
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('teacher_id, name')
      .eq('id', typedRequest.class_id)
      .single()

    const typedClassData2 = classData as { teacher_id: string | null; name: string } | null

    if (!classError && typedClassData2 && typedClassData2.teacher_id) {
      const teacherId = typedClassData2.teacher_id

      const { data: existingInstructorEnrollment } = await supabase
        .from('instructor_enrollments')
        .select('id')
        .eq('student_id', typedRequest.user_id)
        .eq('instructor_id', teacherId)
        .maybeSingle()

      if (!existingInstructorEnrollment) {
        await supabase
          .from('instructor_enrollments')
          .insert({
            student_id: typedRequest.user_id,
            instructor_id: teacherId,
            status: 'approved',
          } as never)
      }
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('enrollment_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq('id', requestId)

    if (updateError) throw updateError

    // Get class name for notification
    const className = typedClassData2?.name || 'the class'

    // Create notification for the student
    await createNotification({
      user_id: typedRequest.user_id,
      title: 'Enrollment Request Approved',
      message: `Your enrollment request for "${className}" has been approved. You can now access the class.`,
      type: 'enrollment',
      link: '/student/my-learning',
      metadata: {
        class_id: typedRequest.class_id,
        request_id: requestId,
      },
    })

    revalidatePath('/admin/enrollment-requests')

    return {
      success: true,
      message: 'Enrollment request approved',
    }
  } catch (error) {
    return handleServerError(error, 'Failed to approve enrollment request')
  }
}

/**
 * Reject enrollment request (admin)
 * 
 * @security Server-side only, admin-only
 */
export async function rejectEnrollmentRequest(requestId: string, reason?: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()
    const canManageRequests = await isAdminOrInstructor()

    if (!user || !canManageRequests) {
      return { success: false, error: 'Unauthorized. Admin or instructor access required.' }
    }

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('enrollment_requests')
      .select('status, user_id, class_id')
      .eq('id', requestId)
      .single()

    if (requestError) throw requestError

    const typedRequest2 = request as { status: string; user_id: string; class_id: string } | null
    if (!typedRequest2 || typedRequest2.status !== 'pending') {
      return { success: false, error: 'This request has already been processed' }
    }

    // Get class name for notification before deleting
    const { data: classData } = await supabase
      .from('classes')
      .select('name')
      .eq('id', typedRequest2.class_id)
      .single()

    const className = classData ? (classData as { name: string }).name : 'the class'

    // Create notification for the student before deleting the request
    await createNotification({
      user_id: typedRequest2.user_id,
      title: 'Enrollment Request Rejected',
      message: reason
        ? `Your enrollment request for "${className}" has been rejected. Reason: ${reason}`
        : `Your enrollment request for "${className}" has been rejected.`,
      type: 'enrollment',
      link: `/student/instructors`,
      metadata: {
        class_id: typedRequest2.class_id,
        request_id: requestId,
        reason: reason || null,
      },
    })

    // Delete the rejected request so the student can re-apply
    // This allows them to create a new request since there's a UNIQUE constraint on (class_id, user_id)
    const { error: deleteError } = await supabase
      .from('enrollment_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) throw deleteError

    revalidatePath('/admin/enrollment-requests')

    return {
      success: true,
      message: 'Enrollment request rejected',
    }
  } catch (error) {
    return handleServerError(error, 'Failed to reject enrollment request')
  }
}

