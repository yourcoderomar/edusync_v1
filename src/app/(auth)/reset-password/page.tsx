'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/lib/validations/auth.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/common/Loader'
import Link from 'next/link'

type ResetStatus = 'checking' | 'ready' | 'error'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [status, setStatus] = useState<ResetStatus>('checking')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) return

      if (error || !data.session) {
        setStatus('error')
        setStatusMessage(
          'This recovery link is invalid or has expired. Please request a new password reset email.'
        )
        return
      }

      setStatus('ready')
      setStatusMessage(null)
    }

    void checkSession()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const onSubmit = async (values: ResetPasswordInput) => {
    if (status !== 'ready') {
      return
    }

    setIsSubmitting(true)
    setServerError(null)

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      setServerError(
        'Unable to update your password right now. Please try again or request a new recovery email.'
      )
      setIsSubmitting(false)
      return
    }

    reset()
    router.push('/signin?reset=success')
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="space-y-6 rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Reset password</h1>
          <p className="text-sm text-gray-600">
            Choose a new password to regain access to your account.
          </p>
        </div>

        {status === 'checking' && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Loader size="sm" inline />
            <span>Confirming recovery link…</span>
          </div>
        )}

        {status === 'error' && statusMessage && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">
            {statusMessage}
          </div>
        )}

        {serverError && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
          aria-disabled={status !== 'ready'}
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a strong password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              disabled={status !== 'ready' || isSubmitting}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-red-600" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              disabled={status !== 'ready' || isSubmitting}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p
                id="confirm-password-error"
                className="text-sm text-red-600"
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={status !== 'ready' || isSubmitting}
            aria-label={
              status !== 'ready'
                ? 'Password reset unavailable'
                : isSubmitting
                  ? 'Updating password'
                  : 'Update password'
            }
          >
            {isSubmitting ? (
              <>
                <Loader size="sm" className="mr-2" inline />
                Updating…
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-700">
          Remembered your password?{' '}
          <Link
            href="/signin"
            className="font-semibold text-blue-700 hover:text-blue-800 underline-offset-2 hover:underline"
          >
            Go back to sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

