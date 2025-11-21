'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth.schema'
import { signUp } from '@/lib/actions/auth/signup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/common/Loader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { countryCodes, defaultCountryCode } from '@/lib/constants/country-codes'

/**
 * Sign up form component with semantic HTML and accessibility
 * 
 * @security Client-side validation + server-side action
 */
export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      phoneCountryCode: defaultCountryCode,
      parentPhoneCountryCode: defaultCountryCode,
    },
  })

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true)
    setError(null)

    // Remove leading + and leading 0 from phone numbers, then combine with country code
    const cleanPhone = data.phone.replace(/^\+/, '').replace(/^0/, '')
    const cleanParentPhone = data.parentPhone.replace(/^\+/, '').replace(/^0/, '')
    
    const phoneWithCode = `${data.phoneCountryCode}${cleanPhone}`
    const parentPhoneWithCode = `${data.parentPhoneCountryCode}${cleanParentPhone}`

    // Create FormData
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('phoneCountryCode', data.phoneCountryCode)
    formData.append('fullName', data.fullName)
    formData.append('phone', phoneWithCode)
    formData.append('parentPhoneCountryCode', data.parentPhoneCountryCode)
    formData.append('parentPhone', parentPhoneWithCode)

    const result = await signUp(formData)

    if (result && !result.success) {
      setError(result.error)
      setIsLoading(false)
    }
    // If successful, user will be redirected by server action
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {error && (
        <div
          className="rounded-md bg-red-50 p-4 text-sm text-red-800"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">
          Full name
        </Label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder="John Doe"
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
          Phone number
        </Label>
        <div className="flex gap-2">
          <Controller
            name="phoneCountryCode"
            control={control}
            defaultValue={defaultCountryCode}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger 
                  id="phoneCountryCode" 
                  className="w-[100px]"
                  aria-invalid={!!errors.phoneCountryCode}
                >
                  <SelectValue placeholder="Code">
                    {field.value && (
                      <span className="flex items-center gap-1.5 text-gray-900 font-medium">
                        <span className="text-base">
                          {countryCodes.find(c => c.code === field.value)?.flag}
                        </span>
                        <span>{field.value}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((country) => (
                    <SelectItem key={`phone-${country.code}-${country.country}`} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{country.flag}</span>
                        <span className="text-gray-900 font-medium">{country.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="1234567890"
            className="flex-1"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            {...register('phone')}
          />
        </div>
        {errors.phoneCountryCode && (
          <p id="phoneCountryCode-error" className="text-sm text-red-600" role="alert">
            {errors.phoneCountryCode.message}
          </p>
        )}
        {errors.phone && (
          <p id="phone-error" className="text-sm text-red-600" role="alert">
            {errors.phone.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentPhone">
          Parent phone number
        </Label>
        <div className="flex gap-2">
          <Controller
            name="parentPhoneCountryCode"
            control={control}
            defaultValue={defaultCountryCode}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger 
                  id="parentPhoneCountryCode" 
                  className="w-[100px]"
                  aria-invalid={!!errors.parentPhoneCountryCode}
                >
                  <SelectValue placeholder="Code">
                    {field.value && (
                      <span className="flex items-center gap-1.5 text-gray-900 font-medium">
                        <span className="text-base">
                          {countryCodes.find(c => c.code === field.value)?.flag}
                        </span>
                        <span>{field.value}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((country) => (
                    <SelectItem key={`parent-${country.code}-${country.country}`} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{country.flag}</span>
                        <span className="text-gray-900 font-medium">{country.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input
            id="parentPhone"
            type="tel"
            autoComplete="tel"
            placeholder="1234567890"
            className="flex-1"
            aria-invalid={!!errors.parentPhone}
            aria-describedby={errors.parentPhone ? 'parentPhone-error' : undefined}
            {...register('parentPhone')}
          />
        </div>
        {errors.parentPhoneCountryCode && (
          <p id="parentPhoneCountryCode-error" className="text-sm text-red-600" role="alert">
            {errors.parentPhoneCountryCode.message}
          </p>
        )}
        {errors.parentPhone && (
          <p id="parentPhone-error" className="text-sm text-red-600" role="alert">
            {errors.parentPhone.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pr-10"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-sm text-red-600" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          Confirm password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pr-10"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-sm text-red-600" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
        aria-label={isLoading ? 'Creating account...' : 'Create account'}
      >
        {isLoading ? (
          <>
            <Loader size="sm" className="mr-2" inline />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>

      <p className="text-center text-sm text-gray-700">
        Already have an account?{' '}
        <Link href="/signin" className="font-semibold text-blue-700 hover:text-blue-800 underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}

