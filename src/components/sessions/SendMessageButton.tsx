'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import { Send } from 'lucide-react'

interface SendMessageButtonProps {
  sessionId: string
}

/**
 * Send message button for sending attendance reports to parents
 * 
 * @accessibility Proper loading states and error messages
 */
export function SendMessageButton({ sessionId }: SendMessageButtonProps) {
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSend = async () => {
    try {
      setIsSending(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/sessions/${sessionId}/send-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to send messages')
        return
      }

      setSuccess(data.message || 'Messages sent successfully')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Send message error:', err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-2 rounded-md bg-green-50 p-2 text-sm text-green-800" role="alert">
          {success}
        </div>
      )}
      <Button
        onClick={handleSend}
        disabled={isSending}
        className="w-full"
        variant="outline"
      >
        {isSending ? (
          <>
            <Loader inline className="mr-2" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send message
          </>
        )}
      </Button>
    </div>
  )
}




