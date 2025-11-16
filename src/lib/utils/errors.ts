/**
 * Error handling utilities
 * 
 * @security Never expose sensitive information in error messages
 */

/**
 * Discriminated union type for server action results
 * TypeScript can automatically narrow based on the 'success' property
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

/**
 * Extract user-friendly error message
 * Sanitizes error to prevent information leakage
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error instanceof Error) {
    // Only return generic message for unknown errors
    return 'An unexpected error occurred. Please try again.'
  }
  
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Check if an error is a real error (not just an empty object)
 * Supabase sometimes returns {} when there's no error
 */
export function isRealError(error: unknown): boolean {
  // Null or undefined
  if (!error) return false
  
  // String error
  if (typeof error === 'string') {
    return error.trim().length > 0
  }
  
  // Error instance
  if (error instanceof Error) return true
  
  // For objects, check if it's truly empty or has meaningful content
  if (typeof error === 'object') {
    // Get only own properties (not inherited)
    const ownKeys = Object.keys(error)
    
    // Completely empty object = not an error
    if (ownKeys.length === 0) {
      return false
    }
    
    const errorObj = error as any
    
    // Check if any property has a meaningful value
    for (const key of ownKeys) {
      const value = errorObj[key]
      
      // Has a truthy value that's not an empty string/object
      if (value) {
        if (typeof value === 'string' && value.trim().length > 0) return true
        if (typeof value === 'number') return true
        if (typeof value === 'boolean') return true
        if (Array.isArray(value) && value.length > 0) return true
        if (typeof value === 'object' && Object.keys(value).length > 0) return true
      }
    }
    
    // Has keys but all values are empty/null/undefined
    return false
  }
  
  // Unknown type
  return false
}

/**
 * Log error server-side (for production error tracking)
 * 
 * @security Logs full error details server-side only
 */
export function logError(error: unknown, context?: string) {
  // Only log if it's a real error
  if (!isRealError(error)) return
  
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error)
  } else {
    // In production, send to error tracking service (e.g., Sentry)
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, getErrorMessage(error))
  }
}

/**
 * Handle server action errors consistently
 * Logs error and returns standardized error response
 * 
 * @security Sanitizes error messages to prevent information leakage
 */
export function handleServerError(error: unknown, fallbackMessage: string = 'An error occurred') {
  logError(error, fallbackMessage)
  
  // If it's a known AppError, return its message
  if (error instanceof AppError) {
    return {
      success: false as const,
      error: error.message,
    }
  }
  
  // For Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as any
    const firstIssue = zodError.issues?.[0]
    return {
      success: false as const,
      error: firstIssue?.message || 'Validation failed',
    }
  }
  
  // For generic errors, return fallback message
  return {
    success: false as const,
    error: fallbackMessage,
  }
}

