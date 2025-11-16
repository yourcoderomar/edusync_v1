'use client'

import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'

interface AttendanceQRCodeProps {
  sessionId: string
  classId: string
}

export function AttendanceQRCode({ sessionId, classId }: AttendanceQRCodeProps) {
  const [copied, setCopied] = useState(false)
  const [scanUrl, setScanUrl] = useState<string>('')
  const [isMounted, setIsMounted] = useState(false)
  
  // Only generate URL on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    // Use current origin (localhost in dev, Vercel URL in production)
    // This ensures QR codes work in the current environment
    const baseUrl = window.location.origin
    setScanUrl(`${baseUrl}/attendance/scan?sessionId=${sessionId}&classId=${classId}`)
  }, [sessionId, classId])
  
  const copyToClipboard = async () => {
    if (!scanUrl) return
    
    try {
      await navigator.clipboard.writeText(scanUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Scan to Mark Attendance</CardTitle>
        <CardDescription>
          Students can scan this QR code with their phone to automatically mark their attendance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isMounted || !scanUrl ? (
          <div className="flex justify-center items-center p-4 bg-white rounded-lg border-2 border-gray-200 min-h-[256px]">
            <Loader size="md" text="Loading QR code..." />
          </div>
        ) : (
          <>
            <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
              <QRCode
                value={scanUrl}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 text-center">Or share this link:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={scanUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-gray-50 text-gray-700"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex-shrink-0"
                  disabled={!scanUrl}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

