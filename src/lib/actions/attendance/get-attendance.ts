'use server'

import { createClient, isAdminOrInstructor } from '@/lib/supabase/server'
import { logError, getErrorMessage, ForbiddenError } from '@/lib/utils/errors'

/**
 * Get attendance records for a specific session
 * 
 * @security Only accessible by authenticated admins
 */
export async function getAttendanceBySession(sessionId: string) {
  try {
    const canViewAttendance = await isAdminOrInstructor()
    if (!canViewAttendance) {
      throw new ForbiddenError('Only admins or instructors can view attendance')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        student:profiles!attendance_student_id_fkey(id, full_name, phone, parent_phone_number),
        marked_by_user:profiles!attendance_marked_by_fkey(id, full_name)
      `)
      .eq('session_id', sessionId)
      .order('marked_at', { ascending: false })

    if (error) {
      logError(error, 'getAttendanceBySession')
      return { success: false, error: 'Failed to fetch attendance' }
    }

    return { success: true, data }
  } catch (error) {
    logError(error, 'getAttendanceBySession')
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get attendance statistics for a session
 * 
 * @security Only accessible by authenticated admins
 */
export async function getAttendanceStats(sessionId: string) {
  try {
    const canViewStats = await isAdminOrInstructor()
    if (!canViewStats) {
      throw new ForbiddenError('Only admins or instructors can view attendance stats')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('session_id', sessionId)

    if (error) {
      logError(error, 'getAttendanceStats')
      return { success: false, error: 'Failed to fetch attendance stats' }
    }

    const attendanceData = (data || []) as Array<{ status: 'present' | 'absent' | 'late' | 'excused' }>
    const stats = {
      total: attendanceData.length,
      present: attendanceData.filter(a => a.status === 'present').length,
      absent: attendanceData.filter(a => a.status === 'absent').length,
      late: attendanceData.filter(a => a.status === 'late').length,
      excused: attendanceData.filter(a => a.status === 'excused').length,
    }

    return { success: true, data: stats }
  } catch (error) {
    logError(error, 'getAttendanceStats')
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get student's own attendance for a specific session
 * 
 * @security Students can only view their own attendance
 */
export async function getStudentAttendance(sessionId: string) {
  try {
    const { createClient, getUser } = await import('@/lib/supabase/server')
    const user = await getUser()
    
    if (!user) {
      return { success: false, error: 'You must be logged in' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('attendance')
      .select('session_id, student_id, status, marked_at')
      .eq('session_id', sessionId)
      .eq('student_id', user.id)
      .maybeSingle()

    if (error) {
      logError(error, 'getStudentAttendance')
      return { success: false, error: 'Failed to fetch attendance' }
    }

    return { success: true, data: data || null }
  } catch (error) {
    logError(error, 'getStudentAttendance')
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get attendance records for a class (all sessions)
 * 
 * @security Only accessible by authenticated admins
 */
export async function getAttendanceByClass(classId: string) {
  try {
    const canViewAttendance = await isAdminOrInstructor()
    if (!canViewAttendance) {
      throw new ForbiddenError('Only admins or instructors can view attendance')
    }

    const supabase = await createClient()

    // First get all sessions for the class
    const { data: sessions, error: sessionsError } = await supabase
      .from('class_sessions')
      .select('id')
      .eq('class_id', classId)

    if (sessionsError) {
      logError(sessionsError, 'getAttendanceByClass - sessions')
      return { success: false, error: 'Failed to fetch class sessions' }
    }

    if (!sessions || sessions.length === 0) {
      return { success: true, data: [] }
    }

    const sessionIds = (sessions as Array<{ id: string }>).map(s => s.id)

    // Get all attendance for these sessions
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        student:profiles!attendance_student_id_fkey(id, full_name, phone),
        session:class_sessions(id, session_date)
      `)
      .in('session_id', sessionIds)
      .order('marked_at', { ascending: false })

    if (error) {
      logError(error, 'getAttendanceByClass')
      return { success: false, error: 'Failed to fetch attendance' }
    }

    return { success: true, data }
  } catch (error) {
    logError(error, 'getAttendanceByClass')
    return { success: false, error: getErrorMessage(error) }
  }
}

