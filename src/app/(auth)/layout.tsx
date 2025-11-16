import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Authentication layout
 * Simple centered layout for auth pages
 * 
 * @semantic Uses semantic HTML structure
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Image
              src="/images/logo.png"
              alt={`${process.env.NEXT_PUBLIC_APP_NAME} logo`}
              width={150}
              height={50}
              className="object-contain h-12 w-auto"
              priority
            />
          </div>
          <p className="text-sm font-medium text-gray-700">
            Educational Management Platform
          </p>
        </header>

        <main className="bg-white rounded-lg shadow-md p-8">
          {children}
        </main>

        <footer className="mt-8 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} EduSync. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

