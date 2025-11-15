import { z } from 'zod'

/**
 * Profile validation schemas
 * 
 * @security All inputs are validated and sanitized
 */

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name is too long')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
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

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UploadPictureInput = z.infer<typeof uploadPictureSchema>

