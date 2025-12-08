'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createGuestAccount } from '@/lib/actions/guests/create-guest'
import { createGuestSchema, type CreateGuestInput } from '@/lib/validations/guest.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/common/Loader'

/**
 * Form to create a guest account (admin-only)
 *
 * @accessibility Provides clear error messaging and loading states
 */
export function CreateGuestForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateGuestInput>({
    resolver: zodResolver(createGuestSchema),
  })

  const onSubmit = async (data: CreateGuestInput) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const result = await createGuestAccount(data)

      if (!result.success) {
        setError(result.error || 'Failed to create guest account')
        return
      }

      // Reset form on success
      reset()
      router.refresh()
    } catch (err) {
      console.error('Create guest account error:', err)
      setError('An unexpected error occurred while creating the guest account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">
          Full Name <span className="text-red-600" aria-label="required">*</span>
        </Label>
        <Input
          id="fullName"
          type="text"
          placeholder="e.g., John Doe"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          {...register('fullName')}
        />
        {errors.fullName && (
          <p id="fullName-error" className="text-sm text-red-600" role="alert">
            {errors.fullName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-red-600" aria-label="required">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="e.g., +1234567890"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          {...register('phone')}
        />
        {errors.phone && (
          <p id="phone-error" className="text-sm text-red-600" role="alert">
            {errors.phone.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentPhone">
          Parent Phone Number <span className="text-red-600" aria-label="required">*</span>
        </Label>
        <Input
          id="parentPhone"
          type="tel"
          placeholder="e.g., +1234567890"
          aria-invalid={!!errors.parentPhone}
          aria-describedby={errors.parentPhone ? 'parentPhone-error' : undefined}
          {...register('parentPhone')}
        />
        {errors.parentPhone && (
          <p id="parentPhone-error" className="text-sm text-red-600" role="alert">
            {errors.parentPhone.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        aria-label={isSubmitting ? 'Creating guest account...' : 'Create guest account'}
      >
        {isSubmitting ? (
          <>
            <Loader size="sm" className="mr-2" inline />
            Creating...
          </>
        ) : (
          'Create Guest Account'
        )}
      </Button>
    </form>
  )
}



