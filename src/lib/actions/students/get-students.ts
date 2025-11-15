'use server'

import { createClient, isAdmin } from '@/lib/supabase/server'
import { logError, getErrorMessage, ForbiddenError } from '@/lib/utils/errors'

/**
 * Get all students
 * 
 * @security Only accessible by authenticated admins (enforced by RLS)
 */
export async function getStudents() {
  try {
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can view students')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false })

    if (error) {
      logError(error, 'getStudents')
      return { success: false, error: 'Failed to fetch students' }
    }

    return { success: true, data }
  } catch (error) {
    logError(error, 'getStudents')
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get a single student by ID
 * 
 * @security Enforced by RLS policies
 */
export async function getStudentById(studentId: string) {
  try {
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can view student details')
    }

    const supabase = await createClient()

    const { data: student, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .eq('role', 'student')
      .single()

    if (error) {
      logError(error, 'getStudentById')
      return { success: false, error: 'Failed to fetch student' }
    }

    // Get student's enrollments with class details
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('enrolled_at, class_id, user_id')
      .eq('user_id', studentId)
    
    // Log actual errors (not empty objects)
    if (enrollmentsError && typeof enrollmentsError === 'object' && 'message' in enrollmentsError) {
      console.error('Enrollments fetch error:', enrollmentsError)
    }

    // Fetch class details for each enrollment
    let enrollmentsWithClasses = []
    if (enrollments && enrollments.length > 0) {
      const classIds = enrollments.map(e => e.class_id)
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, description')
        .in('id', classIds)

      if (classesError && typeof classesError === 'object' && 'message' in classesError) {
        console.error('Classes fetch error:', classesError)
      }

      // Combine enrollments with class data
      enrollmentsWithClasses = enrollments.map(enrollment => ({
        ...enrollment,
        classes: classes?.find(c => c.id === enrollment.class_id) || null
      }))
    }

    // Get student's quiz attempts
    const { data: quizAttempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('id, score, started_at, submitted_at, quiz_id')
      .eq('student_id', studentId)
      .order('started_at', { ascending: false })
    
    // Log actual errors (not empty objects)
    if (attemptsError && typeof attemptsError === 'object' && 'message' in attemptsError) {
      console.error('Quiz attempts fetch error:', attemptsError)
    }

    return {
      success: true,
      data: {
        student,
        enrollments: enrollmentsWithClasses || [],
        quizAttempts: quizAttempts || [],
      },
    }
  } catch (error) {
    logError(error, 'getStudentById')
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get students enrolled in a specific class
 */
export async function getStudentsByClass(classId: string) {
  try {
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      throw new ForbiddenError('Only admins can view class students')
    }

    const supabase = await createClient()

    // Get enrollments for this class
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('enrolled_at, user_id, class_id')
      .eq('class_id', classId)
      .order('enrolled_at', { ascending: false })

    if (error) {
      logError(error, 'getStudentsByClass')
      return { success: false, error: 'Failed to fetch students' }
    }

    if (!enrollments || enrollments.length === 0) {
      return { success: true, data: [] }
    }

    // Fetch student details
    const studentIds = enrollments.map(e => e.user_id)
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name, profile_picture_url, phone, role')
      .in('id', studentIds)

    // Combine enrollments with student data
    const enrollmentsWithStudents = enrollments.map(enrollment => ({
      ...enrollment,
      student: students?.find(s => s.id === enrollment.user_id) || null
    }))

    return { success: true, data: enrollmentsWithStudents }
  } catch (error) {
    logError(error, 'getStudentsByClass')
    return { success: false, error: getErrorMessage(error) }
  }
}

