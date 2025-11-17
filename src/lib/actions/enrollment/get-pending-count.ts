'use server'

import { createClient } from '@/lib/supabase/server'
import { isRealError } from '@/lib/utils/errors'

/**
 * Get count of pending enrollment requests (admin)
 * 
 * @security Server-side only, protected by RLS
 */
interface PendingCountOptions {
  instructorId?: string
}

export async function getPendingEnrollmentCount(options?: PendingCountOptions) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('enrollment_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (options?.instructorId) {
      const { data: instructorClasses, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', options.instructorId)

      if (classesError && isRealError(classesError)) {
        console.error('Pending count classes fetch error:', classesError)
        return 0
      }

      const classRows = (instructorClasses || []) as Array<{ id: string | null }>
      const classIds = classRows.map((cls) => cls.id).filter((id): id is string => Boolean(id))
      if (classIds.length === 0) {
        return 0
      }

      query = query.in('class_id', classIds)
    }

    const { count, error } = await query

    if (error && isRealError(error)) {
      console.error('Pending count fetch error:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Failed to fetch pending enrollment count:', error)
    return 0
  }
}


