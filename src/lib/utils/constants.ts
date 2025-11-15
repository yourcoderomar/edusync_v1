/**
 * Application constants
 */

export const APP_NAME = 'EduSync'
export const APP_DESCRIPTION = 'Educational management platform with role-based access'

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
} as const

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
} as const

export const ENROLLMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export const QUIZ_ATTEMPT_STATUS = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
} as const

export const QUESTION_TYPE = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
} as const

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CLASSES: '/admin/classes',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_ENROLLMENT_REQUESTS: '/admin/enrollment-requests',
  
  // Student routes
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_CLASSES: '/student/classes',
  STUDENT_ENROLLMENT_REQUESTS: '/student/enrollment-requests',
  
  // Shared routes
  PROFILE: '/profile',
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const

