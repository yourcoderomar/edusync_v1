import type { Metadata } from 'next'
import { getGuestAccounts } from '@/lib/actions/guests/get-guests'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateGuestForm } from '@/components/guests/CreateGuestForm'
import { GuestList } from '@/components/guests/GuestList'

export const metadata: Metadata = {
  title: 'Guest Accounts',
  description: 'Create and manage guest accounts for students who have not yet signed up.',
}

/**
 * Guest accounts management page
 * 
 * @semantic Uses semantic HTML with proper structure
 * @security Server-side data fetching with RLS, admin-only
 */
export default async function AdminGuestsPage() {
  const guestsResult = await getGuestAccounts()

  const guests = guestsResult.success && guestsResult.data ? guestsResult.data : []

  return (
    <>
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Guest Accounts</h1>
            <p className="mt-2 text-gray-600">
              Create temporary accounts for students who have not yet signed up. Guest accounts can be enrolled in classes and instructors until the actual user signs up.
            </p>
          </div>
          {guestsResult.success && guests.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Guests</p>
              <p className="text-3xl font-bold text-gray-900">{guests.length}</p>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {!guestsResult.success ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-red-600">{guestsResult.error}</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Guest Accounts</h2>
              <GuestList guests={guests} />
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create Guest Account</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateGuestForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}


