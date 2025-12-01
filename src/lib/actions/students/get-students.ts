'use server'

import { createClient, getUserProfile, isAdmin } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    // Get current user's profile to determine role
    const profile = await getUserProfile()
    if (!profile) {
      throw new ForbiddenError('Not authenticated')
    }

    const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' }

    // Students cannot view other students' details
    if (typedProfile.role === 'student') {
      throw new ForbiddenError('Only admins or instructors can view student details')
    }

    // Instructors can only view details for their own students
    if (typedProfile.role === 'instructor') {
      // First, check direct instructor_enrollments link
      const { data: instructorEnrollment } = await supabase
        .from('instructor_enrollments')
        .select('id, status')
        .eq('student_id', studentId)
        .eq('instructor_id', typedProfile.id)
        .eq('status', 'approved')
        .maybeSingle()

      if (!instructorEnrollment) {
        // Fallback: check if the student is enrolled in ANY class taught by this instructor
        const { data: instructorClasses, error: instructorClassesError } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', typedProfile.id)

        if (!instructorClassesError && instructorClasses && instructorClasses.length > 0) {
          const classIds = instructorClasses.map(c => (c as { id: string }).id)

          const { data: existingInstructorClassEnrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', studentId)
            .in('class_id', classIds)
            .maybeSingle()

          if (!existingInstructorClassEnrollment) {
            throw new ForbiddenError('You can only view details for your own students')
          }
        } else {
          throw new ForbiddenError('You can only view details for your own students')
        }
      }
    }

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
    let enrollmentsWithClasses: Array<{ [key: string]: any }> = []
    if (enrollments && enrollments.length > 0) {
      const enrollmentsList = enrollments as Array<{ class_id: string; [key: string]: any }>
      const classIds = enrollmentsList.map(e => e.class_id)
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, description')
        .in('id', classIds)

      if (classesError && typeof classesError === 'object' && 'message' in classesError) {
        console.error('Classes fetch error:', classesError)
      }

      // Combine enrollments with class data
      const classesList = (classes || []) as Array<{ id: string; name: string; description: string | null }>
      enrollmentsWithClasses = enrollmentsList.map(enrollment => ({
        ...enrollment,
        classes: classesList.find(c => c.id === enrollment.class_id) || null
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

    // Get student's instructor enrollments with instructor details
    const { data: instructorEnrollments, error: instructorEnrollmentsError } = await supabase
      .from('instructor_enrollments')
      .select('id, instructor_id, status, created_at')
      .eq('student_id', studentId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (instructorEnrollmentsError && typeof instructorEnrollmentsError === 'object' && 'message' in instructorEnrollmentsError) {
      console.error('Instructor enrollments fetch error:', instructorEnrollmentsError)
    }

    // Fetch instructor details for each enrollment
    let instructorEnrollmentsWithDetails: Array<{ [key: string]: any }> = []
    if (instructorEnrollments && instructorEnrollments.length > 0) {
      const typedEnrollments = instructorEnrollments as Array<{ id: string; instructor_id: string; status: string; created_at: string }>
      const instructorIds = typedEnrollments.map(ie => ie.instructor_id)
      const { data: instructors, error: instructorsError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_picture_url')
        .in('id', instructorIds)

      if (instructorsError && typeof instructorsError === 'object' && 'message' in instructorsError) {
        console.error('Instructors fetch error:', instructorsError)
      }

      const instructorsList = (instructors || []) as Array<{ id: string; full_name: string | null; profile_picture_url: string | null }>
      instructorEnrollmentsWithDetails = typedEnrollments.map(enrollment => ({
        ...enrollment,
        instructor: instructorsList.find(i => i.id === enrollment.instructor_id) || null
      }))
    }

    return {
      success: true,
      data: {
        student,
        enrollments: enrollmentsWithClasses || [],
        quizAttempts: quizAttempts || [],
        instructorEnrollments: instructorEnrollmentsWithDetails || [],
      },
    }
  } catch (error) {
    logError(error, 'getStudentById')
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get all students with their enrollments
 * Used for filtering by class on the students page
 * 
 * @security Only accessible by authenticated admins (enforced by RLS)
 */
export async function getStudentsWithEnrollments() {
  try {
    const supabase = await createClient()

    const profile = await getUserProfile()
    if (!profile) {
      throw new ForbiddenError('Not authenticated')
    }

    const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' }
    const userIsAdmin = typedProfile.role === 'admin'

    if (typedProfile.role === 'student') {
      throw new ForbiddenError('Only admins or instructors can view students')
    }

    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false })

    if (studentsError) {
      logError(studentsError, 'getStudentsWithEnrollments')
      return { success: false, error: 'Failed to fetch students' }
    }

    if (!students || students.length === 0) {
      return { success: true, data: [] }
    }

    // Get all enrollments
    const studentsList = students as Array<{ id: string; [key: string]: any }>
    const studentIds = studentsList.map(s => s.id)
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('user_id, class_id')
      .in('user_id', studentIds)

    if (enrollmentsError && typeof enrollmentsError === 'object' && 'message' in enrollmentsError) {
      logError(enrollmentsError, 'getStudentsWithEnrollments - enrollments')
    }

    // Get class details for enrollments
    const enrollmentsList = (enrollments || []) as Array<{ class_id: string; user_id: string }>
    const classIds = [...new Set(enrollmentsList.map(e => e.class_id))]
    let classes: any[] = []
    if (classIds.length > 0) {
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds)

      if (classesError && typeof classesError === 'object' && 'message' in classesError) {
        logError(classesError, 'getStudentsWithEnrollments - classes')
      } else {
        classes = classesData || []
      }
    }

    // Combine students with their enrollments
    const studentsWithEnrollments = studentsList.map(student => {
      const studentEnrollments = enrollmentsList.filter(e => e.user_id === student.id)
      const enrolledClassIds = studentEnrollments.map(e => e.class_id)
      const enrolledClasses = classes.filter(c => enrolledClassIds.includes(c.id))
      
      return {
        ...student,
        enrolledClassIds,
        enrolledClasses,
      }
    })

    return { success: true, data: studentsWithEnrollments }
  } catch (error) {
    logError(error, 'getStudentsWithEnrollments')
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get students enrolled in a specific class
 */
export async function getStudentsByClass(classId: string) {
  try {
    const supabase = await createClient()

    const profile = await getUserProfile()
    if (!profile) {
      throw new ForbiddenError('Not authenticated')
    }

    const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' }

    if (typedProfile.role === 'student') {
      throw new ForbiddenError('Only admins or instructors can view class students')
    }

    if (typedProfile.role === 'instructor') {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', classId)
        .single()

      if (classError || !classData) {
        logError(classError, 'getStudentsByClass - class fetch')
        return { success: false, error: 'Class not found' }
      }

      const classInfo = classData as { teacher_id: string | null }

      if (classInfo.teacher_id !== typedProfile.id) {
        throw new ForbiddenError('You can only view students in your classes')
      }
    }

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
    const enrollmentsList2 = enrollments as Array<{ user_id: string; class_id: string; enrolled_at: string }>
    const studentIds = enrollmentsList2.map(e => e.user_id)
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name, profile_picture_url, phone, role')
      .in('id', studentIds)

    // Combine enrollments with student data
    const studentsList2 = (students || []) as Array<{ id: string; full_name: string | null; profile_picture_url: string | null; phone: string | null; role: string }>
    const enrollmentsWithStudents = enrollmentsList2.map(enrollment => ({
      ...enrollment,
      student: studentsList2.find(s => s.id === enrollment.user_id) || null
    }))

    return { success: true, data: enrollmentsWithStudents }
  } catch (error) {
    logError(error, 'getStudentsByClass')
    return { success: false, error: getErrorMessage(error) }
  }
}

