import { z } from 'zod'

/**
 * Profile validation schemas
 * 
 * @security All inputs are validated and sanitized
 */

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name is too long')
    .trim()
    .optional(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number is too long')
    .trim()
    .optional(),
  parentPhone: z
    .string()
    .min(1, 'Parent phone number is required')
    .max(20, 'Parent phone number is too long')
    .trim()
    .optional(),
})

export const uploadPictureSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Only JPEG, PNG, WebP, and GIF images are allowed'
    ),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type UploadPictureInput = z.infer<typeof uploadPictureSchema>

