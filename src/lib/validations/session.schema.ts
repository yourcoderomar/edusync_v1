import { z } from 'zod'

/**
 * Session validation schemas
 * 
 * @security All inputs are validated and sanitized
 */

export const createSessionSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  sessionDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  startsAt: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid start time')
    .optional()
    .nullable(),
  endsAt: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid end time')
    .optional()
    .nullable(),
})

export const updateSessionSchema = z.object({
  id: z.string().uuid('Invalid session ID'),
  title: z
    .string()
    .min(1, 'Session title is required')
    .max(200, 'Title is too long')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description is too long')
    .trim()
    .optional()
    .nullable(),
  sessionDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
    .optional(),
})

export const deleteSessionSchema = z.object({
  id: z.string().uuid('Invalid session ID'),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
export type DeleteSessionInput = z.infer<typeof deleteSessionSchema>

