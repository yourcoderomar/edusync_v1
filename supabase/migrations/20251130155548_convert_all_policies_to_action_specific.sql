-- Migration: Convert ALL policies to action-specific and merge with existing policies
-- Description:
--   This migration converts ALL policies (which cover INSERT/UPDATE/DELETE/SELECT) to
--   separate action-specific policies and merges them with existing specific action policies.
--   This eliminates overlaps between ALL and specific action policies.
--
-- Impact: 
--   - No functional changes - same security, same access control
--   - Eliminates 88+ warnings about multiple permissive policies
--   - Faster query performance (one policy per action)

-- ============================================================================
-- 1. Fix attendance table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "attendance_manage_consolidated" on public.attendance;

-- Merge INSERT: Students can insert OR instructors/admins can insert
drop policy if exists "Students can insert their own attendance" on public.attendance;
create policy "attendance_insert_consolidated"
on public.attendance
for insert
with check (
  -- Student logic
  (
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
  )
  OR
  -- Instructor/Admin logic (from ALL policy)
  (
    is_instructor_for_session(session_id)
    OR is_admin((select auth.uid()))
  )
);

-- Merge UPDATE: Students can update OR instructors/admins can update
drop policy if exists "Students can update their own attendance" on public.attendance;
create policy "attendance_update_consolidated"
on public.attendance
for update
using (
  -- Student logic
  (
    student_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid())
      AND role = 'student'
    )
  )
  OR
  -- Instructor/Admin logic (from ALL policy)
  (
    is_instructor_for_session(session_id)
    OR is_admin((select auth.uid()))
  )
)
with check (
  student_id = (select auth.uid())
  OR is_instructor_for_session(session_id)
  OR is_admin((select auth.uid()))
);

-- Merge SELECT: Students/admins can select OR instructors can select
drop policy if exists "attendance_select_self_or_admin" on public.attendance;
create policy "attendance_select_consolidated"
on public.attendance
for select
using (
  student_id = (select auth.uid())
  OR is_admin((select auth.uid()))
  OR is_instructor_for_session(session_id)
);

-- Create DELETE policy from ALL policy logic
create policy "attendance_delete_consolidated"
on public.attendance
for delete
using (
  is_instructor_for_session(session_id)
  OR is_admin((select auth.uid()))
);

-- ============================================================================
-- 2. Fix classes table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "classes_manage_consolidated" on public.classes;

-- Merge INSERT: Instructor insert OR admin insert (from existing policy)
drop policy if exists "classes_instructor_insert" on public.classes;
create policy "classes_insert_consolidated"
on public.classes
for insert
with check (
  is_admin((select auth.uid()))
  OR is_instructor((select auth.uid()))
);

-- Keep SELECT (no overlap)
-- classes_select_auth remains

-- Create UPDATE policy from ALL policy logic
create policy "classes_update_consolidated"
on public.classes
for update
using (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(id)
)
with check (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(id)
);

-- Create DELETE policy from ALL policy logic
create policy "classes_delete_consolidated"
on public.classes
for delete
using (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(id)
);

-- ============================================================================
-- 3. Fix class_sessions table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "sessions_manage_consolidated" on public.class_sessions;

-- Merge SELECT: Enrolled students/admins OR instructors
drop policy if exists "sessions_select_enrolled_or_admin" on public.class_sessions;
create policy "sessions_select_consolidated"
on public.class_sessions
for select
using (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
  OR EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.class_id = class_sessions.class_id
    AND e.user_id = (select auth.uid())
  )
);

-- Create INSERT policy from ALL policy logic
create policy "sessions_insert_consolidated"
on public.class_sessions
for insert
with check (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);

-- Create UPDATE policy from ALL policy logic
create policy "sessions_update_consolidated"
on public.class_sessions
for update
using (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
)
with check (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);

-- Create DELETE policy from ALL policy logic
create policy "sessions_delete_consolidated"
on public.class_sessions
for delete
using (
  is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);

-- ============================================================================
-- 4. Fix enrollment_requests table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "enrollment_requests_instructor_manage" on public.enrollment_requests;

-- Merge INSERT: Students can insert OR instructors can insert
drop policy if exists "Students can create enrollment requests" on public.enrollment_requests;
create policy "enrollment_requests_insert_consolidated"
on public.enrollment_requests
for insert
with check (
  user_id = (select auth.uid())
  OR is_instructor_for_class(class_id)
);

-- Keep SELECT (already consolidated)
-- enrollment_requests_select_consolidated remains

-- Keep UPDATE (already consolidated)
-- enrollment_requests_update_consolidated remains

-- Merge DELETE: Students can delete OR instructors can delete
drop policy if exists "Students can delete their own enrollment requests" on public.enrollment_requests;
create policy "enrollment_requests_delete_consolidated"
on public.enrollment_requests
for delete
using (
  user_id = (select auth.uid())
  OR is_instructor_for_class(class_id)
);

-- ============================================================================
-- 5. Fix enrollments table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "enrollments_instructor_manage" on public.enrollments;

-- Merge INSERT: Students/admins can insert OR instructors can insert
drop policy if exists "enrollments_insert_self_or_admin" on public.enrollments;
create policy "enrollments_insert_consolidated"
on public.enrollments
for insert
with check (
  user_id = (select auth.uid())
  OR is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);

-- Merge SELECT: Students/admins can select OR instructors can select
drop policy if exists "enrollments_select_self_or_admin" on public.enrollments;
create policy "enrollments_select_consolidated"
on public.enrollments
for select
using (
  user_id = (select auth.uid())
  OR is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);

-- Merge DELETE: Students/admins can delete OR instructors can delete
drop policy if exists "enrollments_delete_self_or_admin" on public.enrollments;
create policy "enrollments_delete_consolidated"
on public.enrollments
for delete
using (
  user_id = (select auth.uid())
  OR is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);

-- Create UPDATE policy from ALL policy logic
create policy "enrollments_update_consolidated"
on public.enrollments
for update
using (
  is_instructor_for_class(class_id)
)
with check (
  is_instructor_for_class(class_id)
);

-- ============================================================================
-- 6. Fix instructor_enrollments table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "instructor_enrollments_manage_consolidated" on public.instructor_enrollments;

-- Merge SELECT: Instructors can read OR students/admins can read
drop policy if exists "instructor_enrollments_instructor_read" on public.instructor_enrollments;
create policy "instructor_enrollments_select_consolidated"
on public.instructor_enrollments
for select
using (
  student_id = (select auth.uid())
  OR instructor_id = (select auth.uid())
  OR is_admin((select auth.uid()))
);

-- Create INSERT policy from ALL policy logic
create policy "instructor_enrollments_insert_consolidated"
on public.instructor_enrollments
for insert
with check (
  student_id = (select auth.uid())
  OR is_admin((select auth.uid()))
);

-- Create UPDATE policy from ALL policy logic
create policy "instructor_enrollments_update_consolidated"
on public.instructor_enrollments
for update
using (
  student_id = (select auth.uid())
  OR is_admin((select auth.uid()))
)
with check (
  student_id = (select auth.uid())
  OR is_admin((select auth.uid()))
);

-- Create DELETE policy from ALL policy logic
create policy "instructor_enrollments_delete_consolidated"
on public.instructor_enrollments
for delete
using (
  student_id = (select auth.uid())
  OR is_admin((select auth.uid()))
);

-- ============================================================================
-- 7. Fix quiz_answers table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "students_manage_own_answers" on public.quiz_answers;

-- Merge SELECT: Students/admins/instructors can read
drop policy if exists "quiz_answers_select_consolidated" on public.quiz_answers;
create policy "quiz_answers_select_consolidated"
on public.quiz_answers
for select
using (
  -- Student logic (from ALL policy)
  EXISTS (
    SELECT 1
    FROM quiz_attempts a
    WHERE a.id = quiz_answers.attempt_id
    AND a.student_id = (select auth.uid())
  )
  OR
  -- Admin/Instructor logic
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_attempt(attempt_id)
);

-- Create INSERT policy from ALL policy logic
create policy "quiz_answers_insert_consolidated"
on public.quiz_answers
for insert
with check (
  EXISTS (
    SELECT 1
    FROM quiz_attempts a
    WHERE a.id = quiz_answers.attempt_id
    AND a.student_id = (select auth.uid())
  )
);

-- Create UPDATE policy from ALL policy logic
create policy "quiz_answers_update_consolidated"
on public.quiz_answers
for update
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

-- Create DELETE policy from ALL policy logic
create policy "quiz_answers_delete_consolidated"
on public.quiz_answers
for delete
using (
  EXISTS (
    SELECT 1
    FROM quiz_attempts a
    WHERE a.id = quiz_answers.attempt_id
    AND a.student_id = (select auth.uid())
  )
);

-- ============================================================================
-- 8. Fix quiz_attempts table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "students_manage_own_attempts" on public.quiz_attempts;

-- Merge SELECT: Students can read OR admins/instructors can read
drop policy if exists "quiz_attempts_select_consolidated" on public.quiz_attempts;
create policy "quiz_attempts_select_consolidated"
on public.quiz_attempts
for select
using (
  -- Student logic (from ALL policy)
  student_id = (select auth.uid())
  OR
  -- Admin/Instructor logic
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
);

-- Create INSERT policy from ALL policy logic
create policy "quiz_attempts_insert_consolidated"
on public.quiz_attempts
for insert
with check (
  student_id = (select auth.uid())
);

-- Create UPDATE policy from ALL policy logic
create policy "quiz_attempts_update_consolidated"
on public.quiz_attempts
for update
using (
  student_id = (select auth.uid())
)
with check (
  student_id = (select auth.uid())
);

-- Create DELETE policy from ALL policy logic
create policy "quiz_attempts_delete_consolidated"
on public.quiz_attempts
for delete
using (
  student_id = (select auth.uid())
);

-- ============================================================================
-- 9. Fix quiz_options table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "quiz_options_manage_consolidated" on public.quiz_options;

-- Merge SELECT: Students can read OR admins/instructors can read
drop policy if exists "students_read_options" on public.quiz_options;
create policy "quiz_options_select_consolidated"
on public.quiz_options
for select
using (
  -- Student logic
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
  OR
  -- Admin/Instructor logic (from ALL policy)
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_question(question_id)
);

-- Create INSERT policy from ALL policy logic
create policy "quiz_options_insert_consolidated"
on public.quiz_options
for insert
with check (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_question(question_id)
);

-- Create UPDATE policy from ALL policy logic
create policy "quiz_options_update_consolidated"
on public.quiz_options
for update
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

-- Create DELETE policy from ALL policy logic
create policy "quiz_options_delete_consolidated"
on public.quiz_options
for delete
using (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_question(question_id)
);

-- ============================================================================
-- 10. Fix quiz_questions table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "quiz_questions_manage_consolidated" on public.quiz_questions;

-- Merge SELECT: Students can read OR admins/instructors can read
drop policy if exists "students_read_questions" on public.quiz_questions;
create policy "quiz_questions_select_consolidated"
on public.quiz_questions
for select
using (
  -- Student logic
  EXISTS (
    SELECT 1
    FROM quizzes q
    JOIN class_sessions s ON s.id = q.session_id
    JOIN enrollments e ON e.class_id = s.class_id
    WHERE q.id = quiz_questions.quiz_id
    AND e.user_id = (select auth.uid())
    AND q.is_published = true
  )
  OR
  -- Admin/Instructor logic (from ALL policy)
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
);

-- Create INSERT policy from ALL policy logic
create policy "quiz_questions_insert_consolidated"
on public.quiz_questions
for insert
with check (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
);

-- Create UPDATE policy from ALL policy logic
create policy "quiz_questions_update_consolidated"
on public.quiz_questions
for update
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

-- Create DELETE policy from ALL policy logic
create policy "quiz_questions_delete_consolidated"
on public.quiz_questions
for delete
using (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
);

-- ============================================================================
-- 11. Fix quiz_retake_requests table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "quiz_retake_requests_instructor_manage" on public.quiz_retake_requests;

-- Merge INSERT: Students can insert OR instructors/admins can insert
drop policy if exists "student_insert_retake" on public.quiz_retake_requests;
create policy "quiz_retake_requests_insert_consolidated"
on public.quiz_retake_requests
for insert
with check (
  student_id = (select auth.uid())
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
);

-- Merge SELECT: Students can read OR admins/instructors can read
drop policy if exists "quiz_retake_requests_select_consolidated" on public.quiz_retake_requests;
create policy "quiz_retake_requests_select_consolidated"
on public.quiz_retake_requests
for select
using (
  student_id = (select auth.uid())
  OR current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
);

-- Merge UPDATE: Students can update OR admins/instructors can update
drop policy if exists "quiz_retake_requests_update_consolidated" on public.quiz_retake_requests;
create policy "quiz_retake_requests_update_consolidated"
on public.quiz_retake_requests
for update
using (
  (student_id = (select auth.uid()) AND status = 'pending')
  OR current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
)
with check (
  (student_id = (select auth.uid()) AND status = 'pending')
  OR current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
);

-- Create DELETE policy from ALL policy logic
create policy "quiz_retake_requests_delete_consolidated"
on public.quiz_retake_requests
for delete
using (
  is_admin((select auth.uid()))
  OR is_instructor_for_quiz(quiz_id)
);

-- ============================================================================
-- 12. Fix quizzes table
-- ============================================================================

-- Remove ALL policy
drop policy if exists "quizzes_manage_consolidated" on public.quizzes;

-- Merge SELECT: Students can read OR admins/instructors can read
drop policy if exists "students_read_published_quizzes" on public.quizzes;
create policy "quizzes_select_consolidated"
on public.quizzes
for select
using (
  -- Student logic
  (
    is_published = true
    AND EXISTS (
      SELECT 1
      FROM class_sessions s
      JOIN enrollments e ON e.class_id = s.class_id
      WHERE s.id = quizzes.session_id
      AND e.user_id = (select auth.uid())
    )
  )
  OR
  -- Admin/Instructor logic (from ALL policy)
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);

-- Create INSERT policy from ALL policy logic
create policy "quizzes_insert_consolidated"
on public.quizzes
for insert
with check (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);

-- Create UPDATE policy from ALL policy logic
create policy "quizzes_update_consolidated"
on public.quizzes
for update
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

-- Create DELETE policy from ALL policy logic
create policy "quizzes_delete_consolidated"
on public.quizzes
for delete
using (
  current_user_role() = 'admin'
  OR is_admin((select auth.uid()))
  OR is_instructor_for_class(class_id)
);






