-- Migration: Ensure delete RLS policy for enrollments table
-- Description:
--   Ensures that the delete RLS policy is properly configured for the enrollments table.
--   This allows:
--   - Students to delete their own enrollments
--   - Admins to delete any enrollment
--   - Instructors to delete enrollments from their classes
--
--   This migration is idempotent and safe to run multiple times.

-- Ensure RLS is enabled (idempotent)
alter table public.enrollments
  enable row level security;

-- Drop existing delete policy if it exists (to recreate with proper permissions)
drop policy if exists "enrollments_delete_consolidated" on public.enrollments;

-- Create delete policy that allows:
-- 1. Students to delete their own enrollments
-- 2. Admins to delete any enrollment
-- 3. Instructors to delete enrollments from their classes
create policy "enrollments_delete_consolidated"
on public.enrollments
for delete
using (
  -- Students can delete their own enrollments
  user_id = (select auth.uid())
  OR 
  -- Admins can delete any enrollment
  is_admin((select auth.uid()))
  OR 
  -- Instructors can delete enrollments from their classes
  is_instructor_for_class(class_id)
);



