'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import { RemoveStudentButton } from '@/components/enrollment/RemoveStudentButton'

interface ClassStudentCardProps {
  enrollment: {
    user_id: string
    enrolled_at: string
    student: {
      id: string
      full_name: string | null
      profile_picture_url: string | null
      phone: string | null
    } | null
  }
  classId: string
}

/**
 * Student card component for class students page
 * Includes remove button functionality
 * 
 * @semantic Uses semantic HTML
 */
export function ClassStudentCard({ enrollment, classId }: ClassStudentCardProps) {
  const student = enrollment.student
  if (!student) return null

  const studentName = student.full_name || 'Unknown Student'

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Student Image */}
          <Link href={`/admin/students/${student.id}`} className="flex-shrink-0">
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
              {student.profile_picture_url ? (
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200">
                  <Image
                    src={student.profile_picture_url}
                    alt={studentName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-blue-600 font-bold text-2xl">
                    {studentName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Student Info */}
          <div className="w-full">
            <Link href={`/admin/students/${student.id}`}>
              <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                {studentName}
              </h3>
            </Link>
            {student.phone && (
              <p className="text-sm text-gray-500 mt-1">{student.phone}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Enrolled {formatDate(enrollment.enrolled_at)}
            </p>
          </div>

          {/* Remove Button */}
          <div className="w-full pt-2 border-t border-gray-200">
            <RemoveStudentButton
              studentId={student.id}
              classId={classId}
              studentName={studentName}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}





