import { z } from 'zod'

/**
 * Enrollment validation schemas
 * 
 * @security All inputs are validated and sanitized
 */

export const submitEnrollmentRequestSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
})

export const approveEnrollmentRequestSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
})

export const rejectEnrollmentRequestSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
})

export const unenrollSchema = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
})

export type SubmitEnrollmentRequestInput = z.infer<typeof submitEnrollmentRequestSchema>
export type ApproveEnrollmentRequestInput = z.infer<typeof approveEnrollmentRequestSchema>
export type RejectEnrollmentRequestInput = z.infer<typeof rejectEnrollmentRequestSchema>
export type UnenrollInput = z.infer<typeof unenrollSchema>

/**
 * Admin enroll student in class
 */
export const adminEnrollStudentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  classId: z.string().uuid('Invalid class ID'),
})

export type AdminEnrollStudentInput = z.infer<typeof adminEnrollStudentSchema>

