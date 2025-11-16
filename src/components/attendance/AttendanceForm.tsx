'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { markBulkAttendance } from '@/lib/actions/attendance/mark-attendance'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader } from '@/components/common/Loader'

interface Student {
  id: string
  full_name: string | null
  phone: string | null
  profile_picture_url: string | null
  currentStatus: string | null
  currentNotes: string
  currentQuizGrade: number | null
}

interface AttendanceFormProps {
  classId: string
  sessionId: string
  students: Student[]
}

/**
 * Attendance marking form with card-based layout
 * 
 * @security Client-side validation + server-side validation
 */
export function AttendanceForm({ classId, sessionId, students }: AttendanceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  
  const [attendanceData, setAttendanceData] = useState<Record<string, {
    status: 'present' | 'absent' | ''
    notes: string
    quizGrade: string
  }>>(
    students.reduce((acc, student) => {
      // Map existing statuses to attended/absent
      const currentStatus = student.currentStatus
      let mappedStatus: 'present' | 'absent' | '' = ''
      if (currentStatus === 'present' || currentStatus === 'late' || currentStatus === 'excused') {
        mappedStatus = 'present'
      } else if (currentStatus === 'absent') {
        mappedStatus = 'absent'
      }
      
      acc[student.id] = {
        status: mappedStatus,
        notes: student.currentNotes || '',
        quizGrade: student.currentQuizGrade?.toString() || '',
      }
      return acc
    }, {} as Record<string, { status: 'present' | 'absent' | ''; notes: string; quizGrade: string }>)
  )

  // Set up real-time subscription for attendance updates
  useEffect(() => {
    if (!sessionId) {
      return
    }

    // Subscribe to attendance changes for this session
    const channel = supabase
      .channel(`attendance:${sessionId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'attendance',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          
          // Handle INSERT or UPDATE events
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRecord = payload.new as any
            const studentId = newRecord.student_id
            
            // Only update if this student is in our list
            if (students.some(s => s.id === studentId)) {
              // Map status to our format
              let mappedStatus: 'present' | 'absent' | '' = ''
              if (newRecord.status === 'present' || newRecord.status === 'late' || newRecord.status === 'excused') {
                mappedStatus = 'present'
              } else if (newRecord.status === 'absent') {
                mappedStatus = 'absent'
              }
              
              // Update attendance data
              setAttendanceData(prev => ({
                ...prev,
                [studentId]: {
                  status: mappedStatus,
                  notes: newRecord.notes || '',
                  quizGrade: newRecord.quiz_grade?.toString() || '',
                },
              }))
              
              // Show visual indicator that this was updated
              setRecentlyUpdated(prev => new Set(prev).add(studentId))
              
              // Remove the indicator after 3 seconds
              setTimeout(() => {
                setRecentlyUpdated(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(studentId)
                  return newSet
                })
              }, 3000)
            }
          }
          
          // Handle DELETE events (if attendance is removed)
          if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as any
            const studentId = oldRecord.student_id
            
            if (students.some(s => s.id === studentId)) {
              setAttendanceData(prev => ({
                ...prev,
                [studentId]: {
                  status: '',
                  notes: '',
                  quizGrade: '',
                },
              }))
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error. Make sure Realtime is enabled for the attendance table in Supabase.', err)
        } else if (status === 'TIMED_OUT') {
          console.warn('Real-time subscription timed out')
        }
      })

    channelRef.current = channel

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [sessionId, students, supabase])

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase().trim()
    const name = student.full_name?.toLowerCase() || ''
    const phone = student.phone?.toLowerCase() || ''
    
    return name.includes(query) || phone.includes(query)
  })

  const updateStudent = (studentId: string, field: 'status' | 'notes' | 'quizGrade', value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }))
  }

  const toggleStatus = (studentId: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: prev[studentId].status === 'present' ? 'absent' : 'present',
      },
    }))
  }


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Filter only students with a status selected
      const attendance = Object.entries(attendanceData)
        .filter(([_, data]) => data.status)
        .map(([studentId, data]) => {
          console.log('Processing student:', studentId, 'Type:', typeof studentId)
          
          // Handle quiz grade - can be text or number
          let quizGrade: string | number | null = null
          if (data.quizGrade) {
            const parsed = parseFloat(data.quizGrade)
            // If it's a valid number, use the number, otherwise keep as text
            quizGrade = !isNaN(parsed) ? parsed : data.quizGrade
          }
          
          return {
            studentId,
            status: data.status as 'present' | 'absent',
            notes: data.notes || null,
            quizGrade,
          }
        })

      if (attendance.length === 0) {
        setError('Please mark attendance for at least one student')
        setIsSubmitting(false)
        return
      }

      console.log('📤 Submitting attendance:', { sessionId, attendance })

      const result = await markBulkAttendance({
        sessionId,
        attendance,
      })
      
      console.log('📬 Server response:', result)

      if (!result.success) {
        setError(result.error || 'Failed to mark attendance')
        return
      }

      // Redirect back to attendance page
      router.push(`/admin/classes/${classId}/sessions/${sessionId}/attendance`)
    } catch (err) {
      console.error('Attendance submission error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search students by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isSubmitting}
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </p>
          )}
        </CardContent>
      </Card>

      {/* Student Grid */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-600">
              {searchQuery ? 'No students found matching your search' : 'No students to display'}
            </p>
            {searchQuery && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-4"
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
          const status = attendanceData[student.id]?.status || ''
          const isAttended = status === 'present'
          const wasRecentlyUpdated = recentlyUpdated.has(student.id)

          return (
            <Card 
              key={student.id} 
              className={`overflow-hidden transition-all duration-300 ${
                wasRecentlyUpdated ? 'ring-2 ring-green-500 ring-offset-2 bg-green-50' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Student Image */}
                  <div className="flex-shrink-0">
                    {student.profile_picture_url ? (
                      <div className="relative h-32 w-32 rounded-2xl overflow-hidden">
                        <Image
                          src={student.profile_picture_url}
                          alt={student.full_name || 'Student'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-32 w-32 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <svg
                          className="h-16 w-16 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Student Name */}
                  <div className="relative w-full">
                    {wasRecentlyUpdated && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white animate-pulse">
                        ✓ Just updated
                      </span>
                    )}
                    <h3 className="font-semibold text-lg text-gray-900">
                      {student.full_name || 'Unknown Student'}
                    </h3>
                    {student.phone && (
                      <p className="text-sm text-gray-500 mt-1">{student.phone}</p>
                    )}
                  </div>

                  {/* Toggle Switch and Quiz Grade */}
                  <div className="w-full flex items-center justify-center gap-4">
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => toggleStatus(student.id)}
                      disabled={isSubmitting}
                      className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isAttended ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={isAttended}
                      aria-label={`Mark ${student.full_name} as ${isAttended ? 'absent' : 'attended'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isAttended ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Quiz Grade */}
                    <Input
                      type="text"
                      value={attendanceData[student.id]?.quizGrade || ''}
                      onChange={(e) => updateStudent(student.id, 'quizGrade', e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Quiz"
                      className="w-20 h-8 text-center"
                    />
                  </div>

                  {/* Optional Notes */}
                  {attendanceData[student.id]?.notes && (
                    <div className="w-full">
                      <Input
                        type="text"
                        value={attendanceData[student.id]?.notes || ''}
                        onChange={(e) => updateStudent(student.id, 'notes', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Notes..."
                        maxLength={500}
                        className="text-sm text-center"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4 sticky bottom-0 bg-white p-4 border-t rounded-lg shadow-lg">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <Loader inline className="mr-2" />
              Saving...
            </>
          ) : (
            'Save attendance'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push(`/admin/classes/${classId}/sessions/${sessionId}/attendance`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
