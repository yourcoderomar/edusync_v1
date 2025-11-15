import type { Metadata } from 'next'
import { SignUpForm } from '@/components/auth/SignUpForm'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new EduSync account to get started with online learning and class management.',
  openGraph: {
    title: 'Sign Up | EduSync',
    description: 'Create a new EduSync account',
  },
}

/**
 * Sign up page
 * 
 * @semantic Uses semantic HTML with proper heading hierarchy
 * @security Form submissions handled by server actions
 */
export default function SignUpPage() {
  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Get started with EduSync today
        </p>
      </header>

      <SignUpForm />
    </>
  )
}

