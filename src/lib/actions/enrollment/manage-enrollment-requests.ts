'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser, isAdmin } from '@/lib/supabase/server'
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
    const userIsAdmin = await isAdmin()

    if (!user || !userIsAdmin) {
      return { success: false, error: 'Unauthorized. Admin access required.' }
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
    const userIsAdmin = await isAdmin()

    if (!user || !userIsAdmin) {
      return { success: false, error: 'Unauthorized. Admin access required.' }
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

