import { z } from 'zod'

/**
 * Quiz validation schemas
 * 
 * @security All inputs are validated and sanitized
 */

export const createQuizSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  title: z
    .string()
    .min(1, 'Quiz title is required')
    .max(200, 'Title is too long')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description is too long')
    .trim()
    .optional()
    .nullable(),
  timeLimit: z
    .number()
    .int()
    .positive('Time limit must be positive')
    .max(300, 'Time limit cannot exceed 300 minutes')
    .optional()
    .nullable(),
  passingScore: z
    .number()
    .int()
    .min(0, 'Passing score cannot be negative')
    .max(100, 'Passing score cannot exceed 100')
    .optional()
    .nullable(),
  questions: z.array(
    z.object({
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
      options: z.array(
        z.object({
          optionText: z.string().min(1, 'Option text is required').max(500, 'Option text is too long').trim(),
          isCorrect: z.boolean().default(false),
          orderNumber: z.number().int().min(0),
        })
      ).optional(),
    })
  ).min(1, 'At least one question is required'),
})

export const updateQuizSchema = z.object({
  id: z.string().uuid('Invalid quiz ID'),
  title: z
    .string()
    .min(1, 'Quiz title is required')
    .max(200, 'Title is too long')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description is too long')
    .trim()
    .optional()
    .nullable(),
  timeLimit: z
    .number()
    .int()
    .positive('Time limit must be positive')
    .max(300, 'Time limit cannot exceed 300 minutes')
    .optional()
    .nullable(),
  passingScore: z
    .number()
    .int()
    .min(0, 'Passing score cannot be negative')
    .max(100, 'Passing score cannot exceed 100')
    .optional()
    .nullable(),
})

export const startQuizAttemptSchema = z.object({
  quizId: z.string().uuid('Invalid quiz ID'),
})

export const submitQuizAnswerSchema = z.object({
  attemptId: z.string().uuid('Invalid attempt ID'),
  questionId: z.string().uuid('Invalid question ID'),
  selectedOptionId: z.string().uuid().optional().nullable(),
  answerText: z.string().max(1000, 'Answer is too long').trim().optional().nullable(),
})

export const submitQuizAttemptSchema = z.object({
  attemptId: z.string().uuid('Invalid attempt ID'),
})

export const requestRetakeSchema = z.object({
  attemptId: z.string().uuid('Invalid attempt ID'),
  reason: z
    .string()
    .min(10, 'Please provide a detailed reason (at least 10 characters)')
    .max(500, 'Reason is too long')
    .trim(),
})

export type CreateQuizInput = z.infer<typeof createQuizSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>
export type StartQuizAttemptInput = z.infer<typeof startQuizAttemptSchema>
export type SubmitQuizAnswerInput = z.infer<typeof submitQuizAnswerSchema>
export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>
export type RequestRetakeInput = z.infer<typeof requestRetakeSchema>

