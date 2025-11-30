'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { getNotifications } from '@/lib/actions/notifications/get-notifications'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notifications/mark-notification-read'
import type { Database } from '@/types/database'

type Notification = Database['public']['Tables']['notifications']['Row']

interface NotificationMenuProps {
  pendingCount: number
  role: 'admin' | 'student' | 'instructor'
}

/**
 * Notification menu component with bell icon and dropdown
 * Shows notifications with realtime updates
 */
export function NotificationMenu({ pendingCount, role }: NotificationMenuProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load initial notifications
  useEffect(() => {
    loadNotifications()
  }, [])

  // Set up realtime subscription
  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to notifications changes for the current user
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notifications',
          filter: undefined, // We'll filter by user_id in the query, but listen to all changes
        },
        (payload) => {
          console.log('Notification change received:', payload)
          // Reload notifications when changes occur
          loadNotifications()
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription connected for notifications')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error for notifications:', err)
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Real-time subscription timed out for notifications')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const result = await getNotifications({ limit: 10, unreadOnly: true })
      if (result.success && result.data) {
        setNotifications(result.data)
        setUnreadCount(result.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId)
    if (result.success) {
      // Remove notification from list since it's now read
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead()
    if (result.success) {
      // Clear all notifications from list since they're now read
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const totalUnread = unreadCount + (pendingCount > 0 ? pendingCount : 0)
  const enrollmentRequestsPath = role === 'student' 
    ? '/student/enrollment-requests' 
    : '/admin/enrollment-requests'

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="relative hover:bg-[#D2D7DF]"
      aria-label={`Notifications${totalUnread > 0 ? ` (${totalUnread} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {totalUnread > 0 && (
        <span
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center"
          aria-label={`${totalUnread} unread notifications`}
        >
          {totalUnread > 9 ? '9+' : totalUnread}
        </span>
      )}
    </Button>
  )

  return (
    <DropdownMenu trigger={trigger} align="right">
      <div className="w-80 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#353535] flex items-center justify-between sticky top-0 bg-white z-10">
          <p className="text-sm font-medium text-[#353535]">
            Notifications {totalUnread > 0 && `(${totalUnread})`}
          </p>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#353535]/70">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 && pendingCount === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#353535]/70">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-[#353535]/20">
            {/* Enrollment requests notification */}
            {pendingCount > 0 && (
              <div className="px-4 py-3 hover:bg-[#D2D7DF]/50 transition-colors">
                <Link href={enrollmentRequestsPath} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#353535]">
                        Enrollment Requests
                      </p>
                      <p className="text-xs text-[#353535]/70 mt-1">
                        {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'} awaiting review
                      </p>
                    </div>
                    <Badge variant="destructive" className="ml-2 flex-shrink-0">
                      {pendingCount}
                    </Badge>
                  </div>
                </Link>
              </div>
            )}

            {/* System notifications */}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-[#D2D7DF]/50 transition-colors ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {notification.link ? (
                      <Link href={notification.link} className="block">
                        <p className="text-sm font-medium text-[#353535]">
                          {notification.title}
                        </p>
                        <p className="text-xs text-[#353535]/70 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#353535]/50 mt-1">
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </Link>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-[#353535]">
                          {notification.title}
                        </p>
                        <p className="text-xs text-[#353535]/70 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#353535]/50 mt-1">
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </>
                    )}
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="flex-shrink-0 p-1 hover:bg-[#D2D7DF] rounded transition-colors"
                      aria-label="Mark as read"
                    >
                      <Check className="h-4 w-4 text-[#353535]/50" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {(notifications.length > 0 || pendingCount > 0) && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2">
              <DropdownMenuItem href={enrollmentRequestsPath}>
                View all notifications
              </DropdownMenuItem>
            </div>
          </>
        )}
      </div>
    </DropdownMenu>
  )
}

