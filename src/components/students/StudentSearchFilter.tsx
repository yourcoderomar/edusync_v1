'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

interface StudentSearchFilterProps {
  students: Student[]
  classes: Class[]
  onFilteredStudentsChange: (filtered: Student[]) => void
}

/**
 * Search and filter component for students
 */
export function StudentSearchFilter({ students, classes, onFilteredStudentsChange }: StudentSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<string>('all')

  // Filter students based on search and class
  const filteredStudents = useMemo(() => {
    let filtered = [...students]

    // Filter by search query (name or phone)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(student => {
        const name = (student.full_name || '').toLowerCase()
        const phone = (student.phone || '').toLowerCase()
        return name.includes(query) || phone.includes(query)
      })
    }

    // Filter by class
    if (selectedClassId !== 'all') {
      filtered = filtered.filter(student => 
        student.enrolledClassIds.includes(selectedClassId)
      )
    }

    return filtered
  }, [students, searchQuery, selectedClassId])

  // Notify parent of filtered results
  useMemo(() => {
    onFilteredStudentsChange(filteredStudents)
  }, [filteredStudents, onFilteredStudentsChange])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedClassId('all')
  }

  const hasActiveFilters = searchQuery.trim() !== '' || selectedClassId !== 'all'

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            Search students
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Class Filter */}
        <div className="sm:w-64">
          <Label htmlFor="class-filter" className="sr-only">
            Filter by class
          </Label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger id="class-filter">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="sm:w-auto"
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

