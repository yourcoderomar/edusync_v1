'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { logError, getErrorMessage } from '@/lib/utils/errors'

/**
 * Mark attendance for the currently logged-in student
 * 
 * @security
 * - Only students can mark their own attendance
 * - Verifies student is enrolled in the class
 * - Verifies session exists and belongs to the class
 * - Validates session date (can mark on session date or within 24 hours after)
 */
export async function markStudentAttendance(sessionId: string, classId: string) {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'You must be logged in to mark attendance' }
    }

    const supabase = await createClient()

    // Get user profile to verify they're a student
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      logError(profileError, 'markStudentAttendance - profile')
      return { success: false, error: 'Failed to verify your account' }
    }

    const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' }
    if (typedProfile.role !== 'student') {
      return { success: false, error: 'Only students can mark their own attendance' }
    }

    // Verify session exists and belongs to the class
    const { data: session, error: sessionError } = await supabase
      .from('class_sessions')
      .select('id, class_id, session_date')
      .eq('id', sessionId)
      .eq('class_id', classId)
      .single()

    if (sessionError || !session) {
      logError(sessionError, 'markStudentAttendance - session')
      return { success: false, error: 'Session not found or invalid' }
    }

    // Validate session date - allow marking on session date or within 24 hours after
    const typedSession = session as { id: string; class_id: string; session_date: string }
    const sessionDate = new Date(typedSession.session_date)
    const now = new Date()
    const hoursSinceSession = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60)
    
    // Don't allow marking for future sessions
    if (sessionDate > now) {
      return { 
        success: false, 
        error: 'Cannot mark attendance for a future session' 
      }
    }
    
    // Optional: Allow marking within 24 hours after session (adjust as needed)
    // Remove this check if you want to allow marking anytime
    if (hoursSinceSession > 24) {
      return { 
        success: false, 
        error: 'Attendance can only be marked within 24 hours of the session' 
      }
    }

    // Verify student is enrolled in the class
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('user_id, class_id')
      .eq('user_id', user.id)
      .eq('class_id', classId)
      .single()

    if (enrollmentError || !enrollment) {
      logError(enrollmentError, 'markStudentAttendance - enrollment')
      return { 
        success: false, 
        error: 'You are not enrolled in this class' 
      }
    }

    // Check if attendance already exists
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id, status')
      .eq('session_id', sessionId)
      .eq('student_id', user.id)
      .single()

    // If already marked as present, return success
    const typedAttendance = existingAttendance as { id: string; status: string } | null
    if (typedAttendance && typedAttendance.status === 'present') {
      return { 
        success: true, 
        data: { 
          message: 'Attendance already marked',
          alreadyMarked: true 
        } 
      }
    }

    // Mark attendance as present
    const attendanceRecord = {
      session_id: sessionId,
      student_id: user.id,
      status: 'present' as const,
      marked_by: user.id, // Student marks their own attendance
      marked_at: new Date().toISOString(),
    }

    const { error: attendanceError } = await supabase
      .from('attendance')
      .upsert(attendanceRecord as never, {
        onConflict: 'session_id,student_id',
      })

    if (attendanceError) {
      console.error('❌ Attendance database error:', JSON.stringify(attendanceError, null, 2))
      logError(attendanceError, 'markStudentAttendance - attendance')
      
      // Provide more specific error messages
      if (attendanceError.code === '42501' || attendanceError.message?.includes('permission')) {
        return { 
          success: false, 
          error: 'You do not have permission to mark attendance. Please contact your administrator.' 
        }
      }
      
      if (attendanceError.code === '23503' || attendanceError.message?.includes('foreign key')) {
        return { 
          success: false, 
          error: 'Invalid session or student information. Please try again.' 
        }
      }
      
      return { 
        success: false, 
        error: attendanceError.message || 'Failed to mark attendance. Please try again.' 
      }
    }

    // Revalidate attendance pages
    revalidatePath(`/admin/classes/${classId}/sessions/${sessionId}/attendance`)
    revalidatePath(`/student/classes/${classId}/sessions/${sessionId}`)
    revalidatePath(`/student/classes/${classId}`)
    revalidatePath(`/student`)

    return { 
      success: true, 
      data: { 
        message: 'Attendance marked successfully',
        alreadyMarked: false 
      } 
    }
  } catch (error) {
    logError(error, 'markStudentAttendance')
    return { success: false, error: getErrorMessage(error) }
  }
}

