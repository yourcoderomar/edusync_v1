import { GuestCard } from './GuestCard'

interface GuestListProps {
  guests: Array<{
    id: string
    full_name: string | null
    phone: string | null
    parent_phone_number: string | null
    created_at: string
    enrollmentCount: number
    instructorEnrollmentCount: number
  }>
}

/**
 * Guest accounts list component
 * 
 * @semantic Uses semantic HTML with proper structure
 */
export function GuestList({ guests }: GuestListProps) {
  if (guests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No guest accounts found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {guests.map((guest) => (
        <GuestCard key={guest.id} guest={guest} />
      ))}
    </div>
  )
}



