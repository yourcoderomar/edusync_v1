import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'

interface StudentCardProps {
  student: {
    id: string
    full_name: string | null
    profile_picture_url: string | null
    phone: string | null
    created_at: string
  }
}

/**
 * Student card component
 * 
 * @semantic Uses semantic HTML
 */
export function StudentCard({ student }: StudentCardProps) {
  return (
    <Link href={`/admin/students/${student.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            {student.profile_picture_url ? (
              <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={student.profile_picture_url}
                  alt={`${student.full_name || 'Student'}'s profile picture`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {(student.full_name || 'S').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">
                {student.full_name || 'Unnamed Student'}
              </CardTitle>
              {student.phone && (
                <p className="text-sm text-gray-500 truncate">{student.phone}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">Joined:</span>{' '}
              <time dateTime={student.created_at}>
                {formatDate(student.created_at)}
              </time>
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

