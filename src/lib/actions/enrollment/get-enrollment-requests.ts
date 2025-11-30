'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { handleServerError, isRealError } from '@/lib/utils/errors'

/**
 * Get all enrollment requests (admin view)
 * 
 * @security Server-side only, protected by RLS
 */
export async function getAllEnrollmentRequests() {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('enrollment_requests')
      .select(`
        *,
        student:profiles!enrollment_requests_user_id_fkey(id, full_name, phone, profile_picture_url),
        class:classes!enrollment_requests_class_id_fkey(id, name, description),
        reviewer:profiles!enrollment_requests_reviewed_by_fkey(id, full_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error && isRealError(error)) {
      console.error('Enrollment requests fetch error:', error)
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch enrollment requests')
  }
}

/**
 * Get enrollment requests for a specific student
 * 
 * @security Server-side only, protected by RLS
 */
export async function getMyEnrollmentRequests() {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('enrollment_requests')
      .select(`
        *,
        class:classes!enrollment_requests_class_id_fkey(id, name, description),
        reviewer:profiles!enrollment_requests_reviewed_by_fkey(id, full_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error && isRealError(error)) {
      console.error('My enrollment requests fetch error:', error)
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch your enrollment requests')
  }
}

/**
 * Get available classes for enrollment (not already enrolled or requested)
 * 
 * @security Server-side only, protected by RLS
 */
export async function getAvailableClasses() {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get all classes
    const { data: allClasses, error: classesError } = await supabase
      .from('classes')
      .select(`
        *,
        creator:profiles!classes_created_by_fkey(id, full_name)
      `)
      .order('name', { ascending: true })

    if (classesError && isRealError(classesError)) throw classesError

    // Get user's enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('user_id', user.id)

    // Get user's pending requests (rejected can be re-applied)
    const { data: requests } = await supabase
      .from('enrollment_requests')
      .select('class_id')
      .eq('user_id', user.id)
      .eq('status', 'pending')

    const enrolledClassIds = new Set(((enrollments || []) as Array<{ class_id: string }>).map(e => e.class_id))
    const pendingClassIds = new Set(((requests || []) as Array<{ class_id: string }>).map(r => r.class_id))

    // Filter out classes already enrolled or have pending requests
    // Note: Rejected requests allow re-application
    const classesList = (allClasses || []) as Array<{ id: string; [key: string]: any }>
    const availableClasses = classesList.filter(
      c => !enrolledClassIds.has(c.id) && !pendingClassIds.has(c.id)
    )

    return {
      success: true,
      data: availableClasses,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch available classes')
  }
}

