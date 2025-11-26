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

type SessionStatus = 'initializing' | 'ready' | 'error'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('initializing')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  // Initialize Supabase auth session from recovery link tokens in the URL hash
  useEffect(() => {
    let isMounted = true

    const initSessionFromHash = async () => {
      try {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash

        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        const type = params.get('type')

        if (type !== 'recovery' || !access_token || !refresh_token) {
          if (!isMounted) return
          setSessionStatus('error')
          setServerError(
            'This recovery link is invalid or has expired. Please request a new password reset email.'
          )
          return
        }

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (!isMounted) return

        if (error) {
          console.error('Supabase setSession error (recovery)', error)
          setSessionStatus('error')
          setServerError(
            'Could not validate this recovery link. Please request a new password reset email.'
          )
          return
        }

        setSessionStatus('ready')
        setServerError(null)
      } catch (err) {
        console.error('Unexpected error initializing recovery session', err)
        if (!isMounted) return
        setSessionStatus('error')
        setServerError(
          'Something went wrong validating this recovery link. Please request a new password reset email.'
        )
      }
    }

    void initSessionFromHash()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const onSubmit = async (values: ResetPasswordInput) => {
    // Don't allow submission until we've confirmed a valid recovery session
    if (sessionStatus !== 'ready') {
      setServerError(
        'This recovery link is not active. Please request a new password reset email and try again.'
      )
      return
    }

    setIsSubmitting(true)
    setServerError(null)

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      // Surface the actual Supabase error message to help debugging
      console.error('Supabase updateUser error', error)
      setServerError(
        error.message ||
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

        {serverError && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a strong password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
            disabled={isSubmitting || sessionStatus !== 'ready'}
            aria-label={
              sessionStatus !== 'ready'
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

