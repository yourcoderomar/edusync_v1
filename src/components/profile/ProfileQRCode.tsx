'use client'

import QRCode from 'react-qr-code'

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
    <div className="p-4 md:p-3 bg-white rounded-xl border-2 border-gray-200 shadow-inner inline-block">
      <div className="p-1.5 bg-white rounded-lg">
        <QRCode
          value={userId}
          size={160}
          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
          viewBox="0 0 256 256"
          fgColor="#1f2937"
          bgColor="#ffffff"
        />
      </div>
    </div>
  )
}





