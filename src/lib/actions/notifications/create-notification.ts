'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
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
 * Create a notification for a user
 * This can be called from server-side code to notify users
 * Uses admin client to bypass RLS for system notifications
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<CreateNotificationResult> {
  try {
    // Use admin client to bypass RLS for system notifications
    // This allows creating notifications for any user
    let supabase
    try {
      // Check if service role key exists
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return {
          success: false,
          error: 'Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart server.',
        }
      }
      
      supabase = createAdminClient()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create admin client',
      }
    }

    // Use database function to bypass RLS (same approach as createNotificationDirect)
    // This is more reliable than direct inserts with service role
    const { data, error } = await (supabase.rpc as any)('create_notification', {
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
        error: error.message || 'Failed to create notification',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Notification created but no data returned',
      }
    }

    return {
      success: true,
      data: data as Database['public']['Tables']['notifications']['Row'],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  inputs: CreateNotificationInput[]
): Promise<CreateNotificationResult[]> {
  try {
    // Use admin client to bypass RLS for system notifications
    const supabase = createAdminClient()

    const notifications = inputs.map((input) => ({
      user_id: input.user_id,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      link: input.link || null,
      metadata: input.metadata || {},
    }))

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications as any)
      .select()

    if (error) {
      return inputs.map(() => ({
        success: false,
        error: error.message || 'Failed to create notifications',
      }))
    }

    return (data || []).map((notification) => ({
      success: true,
      data: notification as Database['public']['Tables']['notifications']['Row'],
    }))
  } catch (error) {
    return inputs.map(() => ({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    }))
  }
}

