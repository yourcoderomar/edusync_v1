'use server'

import { createAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'enrollment' | 'attendance' | 'quiz' | 'session'

export interface CreateNotificationInput {
  user_id: string
  title: string
  message: string
  type?: NotificationType
  link?: string
  metadata?: Record<string, any>
}

export interface CreateNotificationResult {
  success: boolean
  data?: Database['public']['Tables']['notifications']['Row']
  error?: string
}

/**
 * Create notification using database function that bypasses RLS
 * This uses SECURITY DEFINER function which runs with elevated privileges
 */
export async function createNotificationDirect(
  input: CreateNotificationInput
): Promise<CreateNotificationResult> {
  try {
    const adminSupabase = createAdminClient()
    
    // Call the database function that bypasses RLS
    const { data, error } = await (adminSupabase.rpc as any)('create_notification', {
      p_user_id: input.user_id,
      p_title: input.title,
      p_message: input.message,
      p_type: input.type || 'info',
      p_link: input.link || null,
      p_metadata: input.metadata || {},
    })

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to create notification via function',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Function returned no data',
      }
    }

    return {
      success: true,
      data: data as Database['public']['Tables']['notifications']['Row'],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    }
  }
}

