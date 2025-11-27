'use client'

import QRCode from 'react-qr-code'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileQRCodeProps {
  userId: string
}

/**
 * QR code for a student's profile
 *
 * Encodes the Supabase user ID so it can be scanned elsewhere in the app.
 */
export function ProfileQRCode({ userId }: ProfileQRCodeProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Student QR Code</CardTitle>
        <CardDescription>
          This QR code contains your unique student ID. It can be scanned by teachers or the system
          to identify you.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
          <QRCode
            value={userId}
            size={192}
            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            viewBox="0 0 256 256"
          />
        </div>
        <p className="text-xs text-gray-500 break-all">
          ID: <span className="font-mono">{userId}</span>
        </p>
      </CardContent>
    </Card>
  )
}




