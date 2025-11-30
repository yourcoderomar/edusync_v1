'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export interface MarkNotificationReadResult {
  success: boolean
  data?: Database['public']['Tables']['notifications']['Row']
  error?: string
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<MarkNotificationReadResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user can only update their own notifications
      .select()
      .single()

    if (error) {
      console.error('[markNotificationAsRead] Error:', error)
      return {
        success: false,
        error: error.message || 'Failed to mark notification as read',
      }
    }

    return {
      success: true,
      data: data as Database['public']['Tables']['notifications']['Row'],
    }
  } catch (error) {
    console.error('[markNotificationAsRead] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .select()

    if (error) {
      console.error('[markAllNotificationsAsRead] Error:', error)
      return {
        success: false,
        error: error.message || 'Failed to mark all notifications as read',
      }
    }

    return {
      success: true,
      count: data?.length || 0,
    }
  } catch (error) {
    console.error('[markAllNotificationsAsRead] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

