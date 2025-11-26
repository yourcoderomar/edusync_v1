'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser, isAdminOrInstructor } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'

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

    if (classError || !classData) {
      return { success: false, error: 'Class not found' }
    }

    if (!classData.teacher_id) {
      return { success: false, error: 'This class has no instructor assigned yet. Please contact support.' }
    }

    // Ensure student is connected with this instructor first:
    // either via an approved instructor_enrollment OR an existing class enrollment
    const { data: instructorEnrollment } = await supabase
      .from('instructor_enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('instructor_id', classData.teacher_id)
      .eq('status', 'approved')
      .maybeSingle()

    if (!instructorEnrollment) {
      // Fallback: check if student is already enrolled in ANY class with this instructor
      const { data: instructorClasses, error: instructorClassesError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', classData.teacher_id)

      if (!instructorClassesError && instructorClasses && instructorClasses.length > 0) {
        const classIds = instructorClasses.map(c => c.id as string)

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
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('class_id', classId)
      .eq('user_id', user.id)
      .single()

    if (existingEnrollment) {
      return { success: false, error: 'You are already enrolled in this class' }
    }

    // Check if already has pending request
    const { data: existingRequest } = await supabase
      .from('enrollment_requests')
      .select('id, status')
      .eq('class_id', classId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      return { success: false, error: 'You already have a pending request for this class' }
    }

    // Note: Rejected requests can be re-applied (they're kept for history)

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

    if (error) throw error

    revalidatePath('/student/enrollment-requests')
    revalidatePath('/admin/enrollment-requests')

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
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', typedRequest.class_id)
      .single()

    if (!classError && classData && classData.teacher_id) {
      const teacherId = classData.teacher_id as string

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

    revalidatePath('/admin/enrollment-requests')
    revalidatePath('/student/enrollment-requests')

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
      .select('status')
      .eq('id', requestId)
      .single()

    if (requestError) throw requestError

    const typedRequest2 = request as { status: string } | null
    if (!typedRequest2 || typedRequest2.status !== 'pending') {
      return { success: false, error: 'This request has already been processed' }
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('enrollment_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        notes: reason || null,
      } as never)
      .eq('id', requestId)

    if (updateError) throw updateError

    revalidatePath('/admin/enrollment-requests')
    revalidatePath('/student/enrollment-requests')

    return {
      success: true,
      message: 'Enrollment request rejected',
    }
  } catch (error) {
    return handleServerError(error, 'Failed to reject enrollment request')
  }
}

