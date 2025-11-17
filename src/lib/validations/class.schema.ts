import { z } from 'zod'

/**
 * Class validation schemas
 * 
 * @security All inputs are validated and sanitized
 */

export const createClassSchema = z.object({
  name: z
    .string()
    .min(1, 'Class name is required')
    .max(200, 'Class name is too long')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description is too long')
    .trim()
    .optional()
    .nullable(),
  teacherId: z
    .string()
    .uuid('Select a valid instructor')
    .optional()
    .nullable(),
})

export const updateClassSchema = z.object({
  id: z.string().uuid('Invalid class ID'),
  name: z
    .string()
    .min(1, 'Class name is required')
    .max(200, 'Class name is too long')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description is too long')
    .trim()
    .optional()
    .nullable(),
})

export const deleteClassSchema = z.object({
  id: z.string().uuid('Invalid class ID'),
})

export type CreateClassInput = z.infer<typeof createClassSchema>
export type UpdateClassInput = z.infer<typeof updateClassSchema>
export type DeleteClassInput = z.infer<typeof deleteClassSchema>

