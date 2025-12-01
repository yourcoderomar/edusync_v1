'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { createSessionSchema, type CreateSessionInput } from '@/lib/validations/session.schema'
import { createSession } from '@/lib/actions/sessions/create-session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from '@/components/common/Loader'

interface SessionFormProps {
  classId: string
}

/**
 * Session creation form
 * 
 * @security Client-side validation + server-side validation
 */
export function SessionForm({ classId }: SessionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSessionInput>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      classId,
      sessionDate: new Date().toISOString().split('T')[0], // Today's date
    },
  })

  const onSubmit = async (data: CreateSessionInput) => {
    setIsSubmitting(true)
    setError(null)

      try {
        // Combine date and time if provided, preserving the user's local time.
        // We construct a local Date and then convert to ISO, so that:
        // - If user selects 10:00 and they're in UTC+2, we store 08:00Z,
        // - When read back and formatted with toLocaleTimeString, it shows 10:00 again.
        const sessionDate = data.sessionDate
        let startsAt: string | null = null
        let endsAt: string | null = null

        const [year, month, day] = sessionDate.split('-').map(Number)

        if (data.startsAt) {
          const [startHour, startMinute] = data.startsAt.split(':').map(Number)
          const startDate = new Date(year, month - 1, day, startHour, startMinute)
          startsAt = startDate.toISOString()
        }

        if (data.endsAt) {
          const [endHour, endMinute] = data.endsAt.split(':').map(Number)
          const endDate = new Date(year, month - 1, day, endHour, endMinute)
          endsAt = endDate.toISOString()
        }

        const result = await createSession({
          ...data,
          startsAt,
          endsAt,
        })

      if (!result.success) {
        setError(result.error || 'Failed to create session')
        return
      }

      // Redirect to sessions list
      router.push(`/admin/classes/${classId}/sessions`)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Details</CardTitle>
        <CardDescription>
          Enter the details for the new session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sessionDate">
              Session Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sessionDate"
              type="date"
              {...register('sessionDate')}
              disabled={isSubmitting}
              aria-invalid={!!errors.sessionDate}
              aria-describedby={errors.sessionDate ? 'sessionDate-error' : undefined}
            />
            {errors.sessionDate && (
              <p id="sessionDate-error" className="text-sm text-red-600">
                {errors.sessionDate.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startsAt">Start Time (Optional)</Label>
              <Input
                id="startsAt"
                type="time"
                {...register('startsAt')}
                disabled={isSubmitting}
                aria-invalid={!!errors.startsAt}
                aria-describedby={errors.startsAt ? 'startsAt-error' : undefined}
              />
              {errors.startsAt && (
                <p id="startsAt-error" className="text-sm text-red-600">
                  {errors.startsAt.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endsAt">End Time (Optional)</Label>
              <Input
                id="endsAt"
                type="time"
                {...register('endsAt')}
                disabled={isSubmitting}
                aria-invalid={!!errors.endsAt}
                aria-describedby={errors.endsAt ? 'endsAt-error' : undefined}
              />
              {errors.endsAt && (
                <p id="endsAt-error" className="text-sm text-red-600">
                  {errors.endsAt.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader inline className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create session'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/classes/${classId}/sessions`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
