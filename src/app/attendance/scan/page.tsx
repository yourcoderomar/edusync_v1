'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { markStudentAttendance } from '@/lib/actions/attendance/mark-student-attendance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function AttendanceScanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')
  const [alreadyMarked, setAlreadyMarked] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('sessionId')
    const classId = searchParams.get('classId')

    if (!sessionId || !classId) {
      setStatus('error')
      setMessage('Invalid QR code. Missing session or class information.')
      return
    }

    // Mark attendance
    markStudentAttendance(sessionId, classId)
      .then((result) => {
        if (result.success) {
          setStatus('success')
          setMessage(result.data?.message || 'Attendance marked successfully!')
          setAlreadyMarked(result.data?.alreadyMarked || false)
        } else {
          setStatus('error')
          setMessage(result.error || 'Failed to mark attendance')
        }
      })
      .catch((error) => {
        setStatus('error')
        setMessage(error.message || 'An unexpected error occurred')
      })
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Mark Attendance</CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && 'Processing your attendance...'}
            {status === 'success' && (alreadyMarked ? 'Already marked' : 'Success!')}
            {status === 'error' && 'Error'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader size="lg" text="Marking your attendance..." />
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-lg font-semibold text-gray-900 text-center">
                {message}
              </p>
              <Button onClick={() => router.push('/student/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-lg font-semibold text-gray-900 text-center">Error</p>
              <p className="text-sm text-red-600 text-center">{message}</p>
              <div className="space-y-2 w-full">
                <Button onClick={() => router.push('/student/dashboard')} variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
                {message.includes('logged in') && (
                  <Button 
                    onClick={() => {
                      const sessionId = searchParams.get('sessionId')
                      const classId = searchParams.get('classId')
                      // Properly encode the redirect URL with query parameters
                      const scanUrl = `/attendance/scan?sessionId=${encodeURIComponent(sessionId || '')}&classId=${encodeURIComponent(classId || '')}`
                      const redirectUrl = `/signin?redirectTo=${encodeURIComponent(scanUrl)}`
                      router.push(redirectUrl)
                    }} 
                    className="w-full"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

