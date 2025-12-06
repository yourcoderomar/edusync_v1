-- Migration: Consolidate multiple permissive RLS policies
-- Description:
--   This migration consolidates multiple permissive policies for the same action
--   on the same table into single policies using OR conditions. This improves
--   query performance by reducing the number of policy evaluations.
--
-- Impact: 
--   - No functional changes - same security, same access control
--   - Faster query performance (fewer policy evaluations)
--   - Eliminates Supabase warnings about multiple permissive policies

-- ============================================================================
-- 1. Optimize current_user_role() function first
-- ============================================================================

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

-- ============================================================================
-- 2. Consolidate attendance table policies
-- ============================================================================

-- Consolidate ALL action: attendance_instructor_manage OR attendance_modify_admin
drop policy if exists "attendance_instructor_manage" on public.attendance;
drop policy if exists "attendance_modify_admin" on public.attendance;
create policy "attendance_manage_consolidated"
on public.attendance
for all
using (
  is_instructor_for_session(session_id)
  OR is_admin((select auth.uid()))
)
with check (
  is_instructor_for_session(session_id)
  OR is_admin((select auth.uid()))
);

-- ============================================================================
-- 3. Consolidate profiles table policies
-- ============================================================================

-- Consolidate SELECT: profiles_instructor_access OR profiles_instructor_directory OR profiles_select_self_or_admin
drop policy if exists "profiles_instructor_access" on public.profiles;
drop policy if exists "profiles_instructor_directory" on public.profiles;
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_consolidated"
on public.profiles
for select
using (
  id = (select auth.uid())
  OR is_admin((select auth.uid()))
  OR can_instructor_read_profile(id)
  OR role = 'instructor'
);

-- Consolidate UPDATE: profiles_update_admin OR profiles_update_self
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_consolidated"
on public.profiles
for update
using (
  id = (select auth.uid())
  OR is_admin((select auth.uid()))
)
with check (
  id = (select auth.uid())
  OR is_admin((select auth.uid()))
);

-- ============================================================================
-- 4. Consolidate classes table policies
-- ============================================================================

-- Consolidate ALL action: classes_instructor_manage OR classes_modify_admin
drop policy if exists "classes_instructor_manage" on public.classes;
drop policy if exists "classes_modify_admin" on public.classes;
create policy "classes_manage_consolidated"
on public.classes
for all
using (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(id)
)
with check (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(id)
);

-- ============================================================================
-- 5. Consolidate class_sessions table policies
-- ============================================================================

-- Consolidate ALL action: sessions_instructor_manage OR sessions_modify_admin
drop policy if exists "sessions_instructor_manage" on public.class_sessions;
drop policy if exists "sessions_modify_admin" on public.class_sessions;
create policy "sessions_manage_consolidated"
on public.class_sessions
for all
using (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
)
with check (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);

-- ============================================================================
-- 6. Consolidate enrollment_requests table policies
-- ============================================================================

-- Consolidate SELECT: Admins can view all OR Students can view their own
drop policy if exists "Admins can view all enrollment requests" on public.enrollment_requests;
drop policy if exists "Students can view their own enrollment requests" on public.enrollment_requests;
create policy "enrollment_requests_select_consolidated"
on public.enrollment_requests
for select
using (
  user_id = (select auth.uid())
  OR EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = (select auth.uid())
    AND role = 'admin'
  )
);

-- Consolidate UPDATE: Admins can update OR Students can update their own pending
drop policy if exists "Admins can update enrollment requests" on public.enrollment_requests;
drop policy if exists "Students can update their own pending requests" on public.enrollment_requests;
create policy "enrollment_requests_update_consolidated"
on public.enrollment_requests
for update
using (
  (user_id = (select auth.uid()) AND status = 'pending')
  OR EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = (select auth.uid())
    AND role = 'admin'
  )
)
with check (
  (user_id = (select auth.uid()) AND status = 'pending')
  OR EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = (select auth.uid())
    AND role = 'admin'
  )
);

-- ============================================================================
-- 7. Consolidate instructor_enrollments table policies
-- ============================================================================

-- Consolidate ALL action: instructor_enrollments_admin_manage OR instructor_enrollments_student_manage
drop policy if exists "instructor_enrollments_admin_manage" on public.instructor_enrollments;
drop policy if exists "instructor_enrollments_student_manage" on public.instructor_enrollments;
create policy "instructor_enrollments_manage_consolidated"
on public.instructor_enrollments
for all
using (
  student_id = (select auth.uid())
  OR is_admin((select auth.uid()))
)
with check (
  student_id = (select auth.uid())
  OR is_admin((select auth.uid()))
);

-- ============================================================================
-- 8. Consolidate quiz_answers table policies
-- ============================================================================

-- Consolidate SELECT: admin_read_answers OR quiz_answers_instructor_read
drop policy if exists "admin_read_answers" on public.quiz_answers;
drop policy if exists "quiz_answers_instructor_read" on public.quiz_answers;
create policy "quiz_answers_select_consolidated"
on public.quiz_answers
for select
using (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_attempt(attempt_id)
);

-- ============================================================================
-- 9. Consolidate quiz_attempts table policies
-- ============================================================================

-- Consolidate SELECT: admin_read_attempts OR quiz_attempts_instructor_read
drop policy if exists "admin_read_attempts" on public.quiz_attempts;
drop policy if exists "quiz_attempts_instructor_read" on public.quiz_attempts;
create policy "quiz_attempts_select_consolidated"
on public.quiz_attempts
for select
using (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
);

-- ============================================================================
-- 10. Consolidate quiz_options table policies
-- ============================================================================

-- Consolidate ALL action: admin_manage_options OR quiz_options_instructor_manage
drop policy if exists "admin_manage_options" on public.quiz_options;
drop policy if exists "quiz_options_instructor_manage" on public.quiz_options;
create policy "quiz_options_manage_consolidated"
on public.quiz_options
for all
using (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_question(question_id)
)
with check (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_question(question_id)
);

-- ============================================================================
-- 11. Consolidate quiz_questions table policies
-- ============================================================================

-- Consolidate ALL action: admin_manage_questions OR quiz_questions_instructor_manage
drop policy if exists "admin_manage_questions" on public.quiz_questions;
drop policy if exists "quiz_questions_instructor_manage" on public.quiz_questions;
create policy "quiz_questions_manage_consolidated"
on public.quiz_questions
for all
using (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
)
with check (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
);

-- ============================================================================
-- 12. Consolidate quiz_retake_requests table policies
-- ============================================================================

-- Consolidate SELECT: admin_select_retake OR student_select_retake
drop policy if exists "admin_select_retake" on public.quiz_retake_requests;
drop policy if exists "student_select_retake" on public.quiz_retake_requests;
create policy "quiz_retake_requests_select_consolidated"
on public.quiz_retake_requests
for select
using (
  student_id = (select auth.uid())
  OR current_user_role() = 'admin'
);

-- Consolidate UPDATE: admin_update_retake OR student_update_pending_retake
drop policy if exists "admin_update_retake" on public.quiz_retake_requests;
drop policy if exists "student_update_pending_retake" on public.quiz_retake_requests;
create policy "quiz_retake_requests_update_consolidated"
on public.quiz_retake_requests
for update
using (
  (student_id = (select auth.uid()) AND status = 'pending')
  OR current_user_role() = 'admin'
)
with check (
  (student_id = (select auth.uid()) AND status = 'pending')
  OR current_user_role() = 'admin'
);

-- ============================================================================
-- 13. Consolidate quizzes table policies
-- ============================================================================

-- Consolidate ALL action: admin_manage_quizzes OR quizzes_instructor_manage
drop policy if exists "admin_manage_quizzes" on public.quizzes;
drop policy if exists "quizzes_instructor_manage" on public.quizzes;
create policy "quizzes_manage_consolidated"
on public.quizzes
for all
using (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
)
with check (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);






