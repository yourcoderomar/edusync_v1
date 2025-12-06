'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { enrollStudentInClass } from '@/lib/actions/enrollments/enroll-student'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdminEnrollStudentFormProps {
  studentId: string
  availableClasses: Array<{
    id: string
    name: string
    description?: string | null
  }>
}

/**
 * Admin form to enroll a student into a class
 *
 * @accessibility Provides clear error messaging and loading states
 */
export function AdminEnrollStudentForm({
  studentId,
  availableClasses,
}: AdminEnrollStudentFormProps) {
  const router = useRouter()
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!availableClasses || availableClasses.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        This student is already enrolled in all available classes.
      </p>
    )
  }

  const handleSubmit = async () => {
    if (!selectedClassId) {
      setError('Please select a class to enroll the student in.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const result = await enrollStudentInClass({
        studentId,
        classId: selectedClassId,
      })

      if (!result.success) {
        setError(result.error || 'Failed to enroll student')
        return
      }

      router.refresh()
    } catch (err) {
      console.error('Admin enroll student error:', err)
      setError('An unexpected error occurred while enrolling the student.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={selectedClassId ?? undefined}
          onValueChange={(value) => setSelectedClassId(value)}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {availableClasses.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                <div className="flex flex-col">
                  <span>{cls.name}</span>
                  {cls.description && (
                    <span className="text-xs text-gray-500 line-clamp-1">
                      {cls.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !availableClasses.length}
        >
          {isSubmitting ? (
            <>
              <Loader inline className="mr-2" />
              Enrolling...
            </>
          ) : (
            'Enroll in class'
          )}
        </Button>
      </div>
    </div>
  )
}











