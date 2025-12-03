-- Migration: Optimize remaining RLS policies by wrapping auth.uid() and auth.role() in subqueries
-- Description:
--   This migration fixes all remaining RLS policies that use auth.uid() or auth.role() directly
--   This resolves Supabase performance warnings for classes, attendance, enrollments, and quiz tables
--
-- Impact: 
--   - No functional changes - same security, same access control
--   - 10-100x faster queries on large tables
--   - Eliminates all remaining Supabase performance warnings

-- ============================================================================
-- 1. Fix classes table policies
-- ============================================================================

-- Fix classes_select_auth (uses auth.role())
drop policy if exists "classes_select_auth" on public.classes;
create policy "classes_select_auth"
on public.classes
for select
using ((select auth.role()) = 'authenticated');

-- Fix classes_instructor_insert
drop policy if exists "classes_instructor_insert" on public.classes;
create policy "classes_instructor_insert"
on public.classes
for insert
with check (is_admin((select auth.uid())) OR is_instructor((select auth.uid())));

-- Fix classes_modify_admin
drop policy if exists "classes_modify_admin" on public.classes;
create policy "classes_modify_admin"
on public.classes
for all
using (is_admin((select auth.uid())))
with check (is_admin((select auth.uid())));

-- ============================================================================
-- 2. Fix attendance table policies
-- ============================================================================

-- Fix "Students can insert their own attendance"
drop policy if exists "Students can insert their own attendance" on public.attendance;
create policy "Students can insert their own attendance"
on public.attendance
for insert
with check (
  student_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND role = 'student'
  )
  AND EXISTS (
    SELECT 1 FROM class_sessions cs
    INNER JOIN enrollments e ON e.class_id = cs.class_id
    WHERE cs.id = attendance.session_id
    AND e.user_id = (select auth.uid())
  )
);

-- Fix "Students can update their own attendance"
drop policy if exists "Students can update their own attendance" on public.attendance;
create policy "Students can update their own attendance"
on public.attendance
for update
using (
  student_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND role = 'student'
  )
)
with check (student_id = (select auth.uid()));

-- Fix attendance_modify_admin
drop policy if exists "attendance_modify_admin" on public.attendance;
create policy "attendance_modify_admin"
on public.attendance
for all
using (is_admin((select auth.uid())))
with check (is_admin((select auth.uid())));

-- Fix attendance_select_self_or_admin
drop policy if exists "attendance_select_self_or_admin" on public.attendance;
create policy "attendance_select_self_or_admin"
on public.attendance
for select
using (
  student_id = (select auth.uid()) 
  OR 
  is_admin((select auth.uid()))
);

-- ============================================================================
-- 3. Fix class_sessions table policies
-- ============================================================================

-- Fix sessions_modify_admin
drop policy if exists "sessions_modify_admin" on public.class_sessions;
create policy "sessions_modify_admin"
on public.class_sessions
for all
using (is_admin((select auth.uid())))
with check (is_admin((select auth.uid())));

-- Fix sessions_select_enrolled_or_admin
drop policy if exists "sessions_select_enrolled_or_admin" on public.class_sessions;
create policy "sessions_select_enrolled_or_admin"
on public.class_sessions
for select
using (
  is_admin((select auth.uid())) 
  OR 
  EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.class_id = class_sessions.class_id
    AND e.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- 4. Fix enrollment_requests table policies
-- ============================================================================

-- Fix "Admins can view all enrollment requests"
drop policy if exists "Admins can view all enrollment requests" on public.enrollment_requests;
create policy "Admins can view all enrollment requests"
on public.enrollment_requests
for select
using (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = (select auth.uid())
    AND role = 'admin'
  )
);

-- Fix "Admins can update enrollment requests"
drop policy if exists "Admins can update enrollment requests" on public.enrollment_requests;
create policy "Admins can update enrollment requests"
on public.enrollment_requests
for update
using (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = (select auth.uid())
    AND role = 'admin'
  )
);

-- Fix "Students can view their own enrollment requests"
drop policy if exists "Students can view their own enrollment requests" on public.enrollment_requests;
create policy "Students can view their own enrollment requests"
on public.enrollment_requests
for select
using (user_id = (select auth.uid()));

-- Fix "Students can create enrollment requests"
drop policy if exists "Students can create enrollment requests" on public.enrollment_requests;
create policy "Students can create enrollment requests"
on public.enrollment_requests
for insert
with check (user_id = (select auth.uid()));

-- Fix "Students can update their own pending requests"
drop policy if exists "Students can update their own pending requests" on public.enrollment_requests;
create policy "Students can update their own pending requests"
on public.enrollment_requests
for update
using (user_id = (select auth.uid()) AND status = 'pending')
with check (user_id = (select auth.uid()) AND status = 'pending');

-- Fix "Students can delete their own enrollment requests"
drop policy if exists "Students can delete their own enrollment requests" on public.enrollment_requests;
create policy "Students can delete their own enrollment requests"
on public.enrollment_requests
for delete
using (user_id = (select auth.uid()));

-- ============================================================================
-- 5. Fix enrollments table policies
-- ============================================================================

-- Fix enrollments_select_self_or_admin
drop policy if exists "enrollments_select_self_or_admin" on public.enrollments;
create policy "enrollments_select_self_or_admin"
on public.enrollments
for select
using (
  user_id = (select auth.uid()) 
  OR 
  is_admin((select auth.uid()))
);

-- Fix enrollments_insert_self_or_admin
drop policy if exists "enrollments_insert_self_or_admin" on public.enrollments;
create policy "enrollments_insert_self_or_admin"
on public.enrollments
for insert
with check (
  user_id = (select auth.uid()) 
  OR 
  is_admin((select auth.uid()))
);

-- Fix enrollments_delete_self_or_admin
drop policy if exists "enrollments_delete_self_or_admin" on public.enrollments;
create policy "enrollments_delete_self_or_admin"
on public.enrollments
for delete
using (
  user_id = (select auth.uid()) 
  OR 
  is_admin((select auth.uid()))
);

-- ============================================================================
-- 6. Fix quiz_attempts table policies
-- ============================================================================

-- Fix students_manage_own_attempts
drop policy if exists "students_manage_own_attempts" on public.quiz_attempts;
create policy "students_manage_own_attempts"
on public.quiz_attempts
for all
using (student_id = (select auth.uid()))
with check (student_id = (select auth.uid()));

-- ============================================================================
-- 7. Fix quiz_answers table policies
-- ============================================================================

-- Fix students_manage_own_answers
drop policy if exists "students_manage_own_answers" on public.quiz_answers;
create policy "students_manage_own_answers"
on public.quiz_answers
for all
using (
  EXISTS (
    SELECT 1
    FROM quiz_attempts a
    WHERE a.id = quiz_answers.attempt_id
    AND a.student_id = (select auth.uid())
  )
)
with check (
  EXISTS (
    SELECT 1
    FROM quiz_attempts a
    WHERE a.id = quiz_answers.attempt_id
    AND a.student_id = (select auth.uid())
  )
);

-- ============================================================================
-- 8. Fix quiz_options table policies
-- ============================================================================

-- Fix students_read_options
drop policy if exists "students_read_options" on public.quiz_options;
create policy "students_read_options"
on public.quiz_options
for select
using (
  EXISTS (
    SELECT 1
    FROM quiz_questions qq
    JOIN quizzes q ON q.id = qq.quiz_id
    JOIN class_sessions s ON s.id = q.session_id
    JOIN enrollments e ON e.class_id = s.class_id
    WHERE qq.id = quiz_options.question_id
    AND e.user_id = (select auth.uid())
    AND q.is_published = true
  )
);

-- ============================================================================
-- 9. Fix quiz_questions table policies
-- ============================================================================

-- Fix students_read_questions
drop policy if exists "students_read_questions" on public.quiz_questions;
create policy "students_read_questions"
on public.quiz_questions
for select
using (
  EXISTS (
    SELECT 1
    FROM quizzes q
    JOIN class_sessions s ON s.id = q.session_id
    JOIN enrollments e ON e.class_id = s.class_id
    WHERE q.id = quiz_questions.quiz_id
    AND e.user_id = (select auth.uid())
    AND q.is_published = true
  )
);

-- ============================================================================
-- 10. Fix quiz_retake_requests table policies
-- ============================================================================

-- Fix student_insert_retake
drop policy if exists "student_insert_retake" on public.quiz_retake_requests;
create policy "student_insert_retake"
on public.quiz_retake_requests
for insert
with check (student_id = (select auth.uid()));

-- Fix student_select_retake
drop policy if exists "student_select_retake" on public.quiz_retake_requests;
create policy "student_select_retake"
on public.quiz_retake_requests
for select
using (student_id = (select auth.uid()));

-- Fix student_update_pending_retake
drop policy if exists "student_update_pending_retake" on public.quiz_retake_requests;
create policy "student_update_pending_retake"
on public.quiz_retake_requests
for update
using (student_id = (select auth.uid()) AND status = 'pending')
with check (student_id = (select auth.uid()) AND status = 'pending');

-- ============================================================================
-- 11. Fix quizzes table policies
-- ============================================================================

-- Fix students_read_published_quizzes
drop policy if exists "students_read_published_quizzes" on public.quizzes;
create policy "students_read_published_quizzes"
on public.quizzes
for select
using (
  is_published = true
  AND EXISTS (
    SELECT 1
    FROM class_sessions s
    JOIN enrollments e ON e.class_id = s.class_id
    WHERE s.id = quizzes.session_id
    AND e.user_id = (select auth.uid())
  )
);



