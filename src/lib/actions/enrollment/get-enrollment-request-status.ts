'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Get enrollment request status for a specific class
 * 
 * @security Server-side only, protected by RLS
 */
export async function getEnrollmentRequestStatus(classId: string) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('enrollment_requests')
      .select('id, status, created_at')
      .eq('class_id', classId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[getEnrollmentRequestStatus] Error:', error)
      return { success: false, error: 'Failed to check enrollment request status' }
    }

    const typedData = data as { id: string; status: string; created_at: string } | null

    return {
      success: true,
      data: typedData ? {
        id: typedData.id,
        status: typedData.status as 'pending' | 'approved' | 'rejected',
        created_at: typedData.created_at,
      } : null,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to check enrollment request status')
  }
}

/**
 * Get enrollment request statuses for multiple classes
 * 
 * @security Server-side only, protected by RLS
 */
export async function getEnrollmentRequestStatuses(classIds: string[]) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (classIds.length === 0) {
      return { success: true, data: new Map<string, { id: string; status: string; created_at: string }>() }
    }

    const { data, error } = await supabase
      .from('enrollment_requests')
      .select('id, class_id, status, created_at')
      .eq('user_id', user.id)
      .in('class_id', classIds)

    if (error) {
      console.error('[getEnrollmentRequestStatuses] Error:', error)
      return { success: false, error: 'Failed to check enrollment request statuses' }
    }

    const statusMap = new Map<string, { id: string; status: string; created_at: string }>()
    
    if (data) {
      for (const request of data) {
        const typedRequest = request as { id: string; class_id: string; status: string; created_at: string }
        statusMap.set(typedRequest.class_id, {
          id: typedRequest.id,
          status: typedRequest.status,
          created_at: typedRequest.created_at,
        })
      }
    }

    return {
      success: true,
      data: statusMap,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to check enrollment request statuses')
  }
}

