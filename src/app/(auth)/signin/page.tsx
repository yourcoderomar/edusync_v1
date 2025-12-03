import type { Metadata } from 'next'
import { SignInForm } from '@/components/auth/SignInForm'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Alemni account to access your classes, assignments, and more.',
  openGraph: {
    title: 'Sign In | Alemni',
    description: 'Sign in to your Alemni account',
  },
}

/**
 * Sign in page
 * 
 * @semantic Uses semantic HTML with proper heading hierarchy
 * @security Form submissions handled by server actions
 */
export default function SignInPage() {
  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm font-medium text-gray-700">
          Enter your credentials to access your account
        </p>
      </header>

      <SignInForm />
    </>
  )
}

