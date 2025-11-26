'use client'

import { useState } from 'react'
import { StudentList } from './StudentList'
import { StudentSearchFilter } from './StudentSearchFilter'

interface Student {
  id: string
  full_name: string | null
  profile_picture_url: string | null
  phone: string | null
  created_at: string
  enrolledClassIds: string[]
  enrolledClasses: Array<{ id: string; name: string }>
}

interface Class {
  id: string
  name: string
}

interface StudentsPageClientProps {
  initialStudents: Student[]
  classes: Class[]
}

/**
 * Client component for students page with search and filter
 */
export function StudentsPageClient({ initialStudents, classes }: StudentsPageClientProps) {
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(initialStudents)

  return (
    <>
      <StudentSearchFilter
        students={initialStudents}
        classes={classes}
        onFilteredStudentsChange={setFilteredStudents}
      />
      <StudentList students={filteredStudents} />
    </>
  )
}





