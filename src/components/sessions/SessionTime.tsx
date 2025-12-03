'use client'

import type { HTMLAttributes } from 'react'

interface SessionTimeProps extends HTMLAttributes<HTMLTimeElement> {
  isoString?: string | null
}

/**
 * Render a time based on an ISO timestamp using the browser's local timezone.
 *
 * This avoids server-timezone offsets (e.g. Vercel running in UTC) when
 * displaying session start/end times.
 */
export function SessionTime({ isoString, className, ...props }: SessionTimeProps) {
  if (!isoString) {
    return <span className="text-gray-400">Not set</span>
  }

  const date = new Date(isoString)
  const formatted = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <time dateTime={isoString} className={className} {...props}>
      {formatted}
    </time>
  )
}


