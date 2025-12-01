'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createInstructorEnrollment } from '@/lib/actions/instructor-enrollments/create-instructor-enrollment'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EnrollWithInstructorButtonProps {
  instructorId: string
  disabled?: boolean
}

export function EnrollWithInstructorButton({ instructorId, disabled }: EnrollWithInstructorButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createInstructorEnrollment(instructorId, passcode || undefined)

      if (result.success) {
        setIsOpen(false)
        setPasscode('')
        router.refresh()
        // Force a full page reload to ensure UI updates
        window.location.reload()
      } else {
        setError(result.error || 'Failed to enroll with instructor')
      }
    } catch (err) {
      console.error('Enroll with instructor error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setPasscode('')
    setError(null)
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        Enroll with Instructor
      </Button>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold mb-4">Enter Passcode</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="passcode">Passcode</Label>
                <Input
                  id="passcode"
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !passcode.trim()}>
                  {isSubmitting ? (
                    <>
                      <Loader inline className="mr-2" />
                      Enrolling...
                    </>
                  ) : (
                    'Enroll'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
