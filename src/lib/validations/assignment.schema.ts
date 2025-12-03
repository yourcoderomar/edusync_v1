import { z } from 'zod'

/**
 * Assignment validation schemas
 *
 * Supports three modes:
 * - freeform: single rich-text instructions
 * - structured: explicit questions/options payload
 * - bulk_mcq: grid-style A/B/C/D entry
 */

export const assignmentModeEnum = z.enum(['freeform', 'structured', 'bulk_mcq'])

const baseAssignmentFields = {
  sessionId: z.string().uuid('Invalid session ID'),
  title: z
    .string()
    .min(1, 'Assignment title is required')
    .max(200, 'Title is too long')
    .trim(),
  dueAt: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .refine(
      (val) => val === null || !isNaN(Date.parse(val)),
      'Invalid due date'
    )
    .optional()
    .nullable(),
  maxPoints: z
    .number()
    .int()
    .positive('Max points must be positive')
    .max(1000, 'Max points cannot exceed 1000')
    .optional()
    .nullable(),
}

// Freeform mode: one big instructions field
export const createFreeformAssignmentSchema = z.object({
  ...baseAssignmentFields,
  mode: z.literal('freeform'),
  instructions: z
    .string()
    .min(1, 'Instructions are required')
    .max(8000, 'Instructions are too long')
    .trim(),
})

// Shared question/option shapes for structured and bulk_mcq
export const assignmentOptionSchema = z.object({
  optionText: z
    .string()
    .min(1, 'Option text is required')
    .max(500, 'Option text is too long')
    .trim(),
  isCorrect: z.boolean().default(false),
  orderNumber: z.number().int().min(0),
})

export const assignmentQuestionSchema = z.object({
  questionText: z
    .string()
    .min(1, 'Question text is required')
    .max(1000, 'Question text is too long')
    .trim(),
  questionType: z.enum(['multiple_choice', 'true_false', 'short_answer']),
  points: z
    .number()
    .int()
    .positive('Points must be positive')
    .default(1),
  orderNumber: z.number().int().min(0),
  options: z.array(assignmentOptionSchema).optional(),
})

// Structured mode: explicit questions/options payload
export const createStructuredAssignmentSchema = z.object({
  ...baseAssignmentFields,
  mode: z.literal('structured'),
  instructions: z
    .string()
    .max(4000, 'Instructions are too long')
    .trim()
    .optional()
    .nullable(),
  questions: z
    .array(assignmentQuestionSchema)
    .min(1, 'At least one question is required'),
})

// Bulk MCQ mode: N questions, each with a correct letter A/B/C/D and editable points
export const bulkMcqRowSchema = z.object({
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  points: z
    .number()
    .int()
    .positive('Points must be positive')
    .default(1),
})

export const createBulkMcqAssignmentSchema = z.object({
  ...baseAssignmentFields,
  mode: z.literal('bulk_mcq'),
  instructions: z
    .string()
    .max(4000, 'Instructions are too long')
    .trim()
    .optional()
    .nullable(),
  questionCount: z
    .number()
    .int()
    .min(1, 'At least one question is required')
    .max(200, 'Too many questions'),
  rows: z
    .array(bulkMcqRowSchema)
    .min(1, 'At least one question row is required')
    .max(200, 'Too many question rows'),
})

// Union used by server actions for creation
export const createAssignmentSchema = z.discriminatedUnion('mode', [
  createFreeformAssignmentSchema,
  createStructuredAssignmentSchema,
  createBulkMcqAssignmentSchema,
])

// Submission schema: supports either freeform content or structured answers
export const submitAssignmentSchema = z
  .object({
    assignmentId: z.string().uuid('Invalid assignment ID'),
    // Freeform / file-link style submission content
    content: z
      .string()
      .max(8000, 'Submission is too long')
      .trim()
      .optional()
      .nullable(),
    // For bulk_mcq / structured modes: per-question MCQ answers
    answers: z
      .array(
        z.object({
          questionId: z.string().uuid('Invalid question ID'),
          selectedOptionId: z.string().uuid('Invalid option ID').nullable(),
        })
      )
      .optional(),
  })
  .refine(
    (val) =>
      (val.content && val.content.trim().length > 0) ||
      (Array.isArray(val.answers) && val.answers.length > 0),
    {
      message: 'Submission content or answers are required',
      path: ['content'],
    }
  )

export type AssignmentMode = z.infer<typeof assignmentModeEnum>
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>

// Update schema for editing basic assignment fields
export const updateAssignmentSchema = z.object({
  id: z.string().uuid('Invalid assignment ID'),
  title: z
    .string()
    .min(1, 'Assignment title is required')
    .max(200, 'Title is too long')
    .trim()
    .optional(),
  instructions: z
    .string()
    .max(8000, 'Instructions are too long')
    .trim()
    .optional()
    .nullable(),
  dueAt: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .refine(
      (val) => val === null || !isNaN(Date.parse(val)),
      'Invalid due date'
    )
    .optional()
    .nullable(),
  maxPoints: z
    .number()
    .int()
    .positive('Max points must be positive')
    .max(1000, 'Max points cannot exceed 1000')
    .optional()
    .nullable(),
})

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>


