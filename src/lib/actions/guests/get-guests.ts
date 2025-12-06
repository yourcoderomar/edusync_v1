'use server'

import { createClient, getUser, isAdmin } from '@/lib/supabase/server'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Get all guest accounts (admin-only)
 *
 * @security Server-side only, admin-only
 */
export async function getGuestAccounts() {
  try {
    const user = await getUser()
    const isUserAdmin = await isAdmin()

    if (!user || !isUserAdmin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      }
    }

    const supabase = await createClient()

    // Get all guest accounts
    const { data: guests, error: guestsError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, parent_phone_number, created_at, is_guest')
      .eq('is_guest', true)
      .order('created_at', { ascending: false })

    if (guestsError) {
      throw guestsError
    }

    // Get enrollment counts for each guest
    const guestIds = (guests || []).map((g: any) => g.id)
    let enrollmentCounts: Record<string, number> = {}

    if (guestIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('user_id')
        .in('user_id', guestIds)

      // Count enrollments per guest
      enrollmentCounts = (enrollments || []).reduce((acc, enrollment: any) => {
        const userId = enrollment.user_id
        acc[userId] = (acc[userId] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Get instructor enrollment counts
    let instructorEnrollmentCounts: Record<string, number> = {}

    if (guestIds.length > 0) {
      const { data: instructorEnrollments } = await supabase
        .from('instructor_enrollments')
        .select('student_id')
        .in('student_id', guestIds)

      instructorEnrollmentCounts = (instructorEnrollments || []).reduce((acc, enrollment: any) => {
        const studentId = enrollment.student_id
        acc[studentId] = (acc[studentId] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Combine data
    const guestsWithCounts = (guests || []).map((guest: any) => ({
      ...guest,
      enrollmentCount: enrollmentCounts[guest.id] || 0,
      instructorEnrollmentCount: instructorEnrollmentCounts[guest.id] || 0,
    }))

    return {
      success: true,
      data: guestsWithCounts,
    }
  } catch (error) {
    return handleServerError(error, 'Failed to fetch guest accounts')
  }
}

