import { z } from 'zod'

/**
 * Guest account validation schemas
 * 
 * @security All inputs are validated and sanitized
 */

export const createGuestSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name is too long')
    .trim(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number is too long')
    .trim(),
  parentPhone: z
    .string()
    .min(1, 'Parent phone number is required')
    .max(20, 'Parent phone number is too long')
    .trim(),
})

export type CreateGuestInput = z.infer<typeof createGuestSchema>



