import { z } from 'zod'

/**
 * Attendance validation schemas
 * 
 * @security All inputs are validated and sanitized
 */

export const markAttendanceSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  studentId: z.string().uuid('Invalid student ID'),
  status: z.enum(['present', 'absent', 'late', 'excused'], {
    required_error: 'Attendance status is required',
  }),
  notes: z.string().max(500, 'Notes too long').optional().nullable(),
  quizGrade: z.number().min(0).max(100).optional().nullable(),
})

export const bulkMarkAttendanceSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  attendance: z.array(
    z.object({
      studentId: z.string().min(1, 'Student ID is required'),
      status: z.enum(['present', 'absent', 'late', 'excused']),
      notes: z.union([z.string(), z.null()]).optional(),
      quizGrade: z.union([z.string(), z.number(), z.null()]).optional(),
    }).passthrough()
  ).min(1, 'At least one student must be marked'),
})

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>
export type BulkMarkAttendanceInput = z.infer<typeof bulkMarkAttendanceSchema>

