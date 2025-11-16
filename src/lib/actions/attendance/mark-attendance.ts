'use server'

import { revalidatePath } from 'next/cache'
import { createClient, isAdmin, getUser } from '@/lib/supabase/server'
import { logError, getErrorMessage, ForbiddenError } from '@/lib/utils/errors'
import { markAttendanceSchema, bulkMarkAttendanceSchema, type BulkMarkAttendanceInput } from '@/lib/validations/attendance.schema'

/**
 * Mark attendance for multiple students in a session (bulk operation)
 * 
 * @security Only accessible by authenticated admins
 */
export async function markBulkAttendance(input: BulkMarkAttendanceInput) {
  try {
    console.log('📥 Received attendance data:', JSON.stringify(input, null, 2))
    
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can mark attendance')
    }

    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate input
    const validatedData = bulkMarkAttendanceSchema.parse(input)
    console.log('✅ Validation passed')

    const supabase = await createClient()

    // Prepare attendance records
    const records = validatedData.attendance.map(a => {
      // Handle quiz grade - convert string to number if possible
      let quizGrade = null
      const grade = (a as any).quizGrade
      if (grade !== null && grade !== undefined && grade !== '') {
        if (typeof grade === 'number') {
          quizGrade = grade
        } else if (typeof grade === 'string') {
          const parsed = parseFloat(grade)
          quizGrade = !isNaN(parsed) ? parsed : null
        }
      }
      
      return {
        session_id: validatedData.sessionId,
        student_id: a.studentId,
        status: a.status,
        marked_by: user.id,
        marked_at: new Date().toISOString(),
        notes: (a as any).notes || null,
        quiz_grade: quizGrade,
      }
    })

    console.log('💾 Saving records:', JSON.stringify(records, null, 2))
    
    // Upsert attendance records (insert or update if exists)
    const { error } = await supabase
      .from('attendance')
      .upsert(records as never, {
        onConflict: 'session_id,student_id',
      })

    if (error) {
      console.error('❌ Database error:', error)
      logError(error, 'markBulkAttendance')
      return { success: false, error: 'Failed to mark attendance' }
    }

    console.log('✅ Attendance saved successfully')
    
    // Revalidate the attendance page
    revalidatePath(`/admin/classes`)
    
    return { success: true, data: { count: records.length } }
  } catch (error) {
    console.error('❌ Unexpected error in markBulkAttendance:', error)
    
    // Re-throw redirect errors
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }

    logError(error, 'markBulkAttendance')
    
    // Return detailed error message for debugging
    const detailedError = error instanceof Error ? error.message : String(error)
    console.error('❌ Detailed error:', detailedError)
    return { success: false, error: detailedError || getErrorMessage(error) }
  }
}

/**
 * Get enrolled students for a class (to mark attendance)
 * 
 * @security Only accessible by authenticated admins
 */
export async function getStudentsForAttendance(classId: string, sessionId: string) {
  try {
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can access this')
    }

    const supabase = await createClient()

    // Get enrolled students
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('class_id', classId)

    if (enrollError) {
      logError(enrollError, 'getStudentsForAttendance - enrollments')
      return { success: false, error: 'Failed to fetch enrolled students' }
    }

    if (!enrollments || enrollments.length === 0) {
      return { success: true, data: [] }
    }

    const studentIds = (enrollments as Array<{ user_id: string }>).map(e => e.user_id)

    // Get student profiles
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, profile_picture_url')
      .in('id', studentIds)
      .eq('role', 'student')
      .order('full_name', { ascending: true })

    if (studentsError) {
      logError(studentsError, 'getStudentsForAttendance - students')
      return { success: false, error: 'Failed to fetch student details' }
    }

    // Get existing attendance for this session
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('student_id, status, notes, quiz_grade')
      .eq('session_id', sessionId)
      .in('student_id', studentIds)

    // Get quiz grades from submitted quiz attempts for quizzes in this session
    // This will get the latest quiz grade even if attendance hasn't been marked yet
    // First, get all quizzes for this session
    const { data: sessionQuizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('session_id', sessionId)

    const quizScoresMap = new Map<string, number>()
    
    if (sessionQuizzes && sessionQuizzes.length > 0) {
      const quizIds = sessionQuizzes.map(q => q.id)
      
      // Get all submitted quiz attempts for these quizzes
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('student_id, score, submitted_at')
        .in('quiz_id', quizIds)
        .in('student_id', studentIds)
        .not('submitted_at', 'is', null)
        .not('score', 'is', null)

      if (quizAttempts) {
        // Get the latest quiz score for each student
        const quizGradesMap = new Map<string, { score: number; submittedAt: string }>()
        
        quizAttempts.forEach((attempt: any) => {
          const studentId = attempt.student_id
          const score = attempt.score
          const submittedAt = attempt.submitted_at

          if (!studentId || score === null || !submittedAt) return

          // Only keep the latest submission for each student
          const existing = quizGradesMap.get(studentId)
          if (!existing || new Date(submittedAt) > new Date(existing.submittedAt)) {
            quizGradesMap.set(studentId, { score, submittedAt })
          }
        })

        // Convert to simple score map
        quizGradesMap.forEach((value, studentId) => {
          quizScoresMap.set(studentId, value.score)
        })
      }
    }

    // Merge existing attendance with student data
    // Priority: attendance quiz_grade > latest quiz attempt score
    const attendanceData = (existingAttendance || []) as Array<{ student_id: string; status: string; notes: string | null; quiz_grade: number | null }>
    const studentsData = (students || []) as Array<{ id: string; full_name: string | null; phone: string | null; profile_picture_url: string | null }>
    const studentsWithAttendance = studentsData.map(student => {
      const existing = attendanceData.find(a => a.student_id === student.id)
      // Use quiz grade from attendance if exists, otherwise use latest quiz attempt score
      const quizGrade = existing?.quiz_grade ?? quizScoresMap.get(student.id) ?? null
      
      return {
        ...student,
        currentStatus: existing?.status || null,
        currentNotes: existing?.notes || '',
        currentQuizGrade: quizGrade,
      }
    }) || []

    return { success: true, data: studentsWithAttendance }
  } catch (error) {
    logError(error, 'getStudentsForAttendance')
    return { success: false, error: getErrorMessage(error) }
  }
}

