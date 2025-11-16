'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { logError, getErrorMessage, type ActionResult } from '@/lib/utils/errors'
import type { Database } from '@/types/database'

type ClassWithCreator = Database['public']['Tables']['classes']['Row'] & {
  creator: {
    id: string
    full_name: string | null
    phone: string | null
    role: 'admin' | 'student'
  } | null
}

/**
 * Get all classes for admin
 * 
 * @security Only accessible by authenticated admins (enforced by RLS)
 */
export async function getClasses() {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        creator:profiles!classes_created_by_fkey(id, full_name, phone, role)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logError(error, 'getClasses')
      return { success: false, error: 'Failed to fetch classes' }
    }

    return { success: true, data }
  } catch (error) {
    logError(error, 'getClasses')
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get a single class by ID
 * 
 * @security Enforced by RLS policies
 */
export async function getClassById(classId: string): Promise<ActionResult<ClassWithCreator>> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        creator:profiles!classes_created_by_fkey(id, full_name, phone, role)
      `)
      .eq('id', classId)
      .single()

    if (error) {
      logError(error, 'getClassById')
      return { success: false, error: 'Failed to fetch class' }
    }

    return { success: true, data }
  } catch (error) {
    logError(error, 'getClassById')
    return { success: false, error: getErrorMessage(error) }
  }
}

