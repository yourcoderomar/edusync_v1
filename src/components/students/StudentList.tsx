import { StudentCard } from './StudentCard'

interface StudentListProps {
  students: Array<{
    id: string
    full_name: string | null
    profile_picture_url: string | null
    phone: string | null
    created_at: string
    [key: string]: any // Allow additional properties like enrolledClasses
  }>
}

/**
 * Student list component
 * 
 * @semantic Uses semantic HTML with proper ARIA labels
 */
export function StudentList({ students }: StudentListProps) {
  if (!students || students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No students found.</p>
      </div>
    )
  }

  return (
    <section aria-labelledby="students-heading">
      <h2 id="students-heading" className="sr-only">
        List of students
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <article key={student.id}>
            <StudentCard student={student} />
          </article>
        ))}
      </div>
    </section>
  )
}

