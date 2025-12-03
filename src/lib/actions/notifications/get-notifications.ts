'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export interface GetNotificationsResult {
  success: boolean
  data?: Database['public']['Tables']['notifications']['Row'][]
  unreadCount?: number
  error?: string
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(options?: {
  limit?: number
  unreadOnly?: boolean
}): Promise<GetNotificationsResult> {
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

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.eq('read', false)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getNotifications] Error:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch notifications',
      }
    }

    // Get unread count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return {
      success: true,
      data: (data || []) as Database['public']['Tables']['notifications']['Row'][],
      unreadCount: count || 0,
    }
  } catch (error) {
    console.error('[getNotifications] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(): Promise<{
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

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('[getUnreadNotificationCount] Error:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch unread count',
      }
    }

    return {
      success: true,
      count: count || 0,
    }
  } catch (error) {
    console.error('[getUnreadNotificationCount] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}



