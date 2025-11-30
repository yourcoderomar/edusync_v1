-- Migration: Optimize RLS policies by wrapping auth.uid() in subqueries
-- Description:
--   This migration improves query performance by evaluating auth.uid() once per query
--   instead of once per row. This resolves Supabase performance warnings.
--   See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Impact: 
--   - No functional changes - same security, same access control
--   - 10-100x faster queries on large tables
--   - Eliminates Supabase performance warnings

-- ============================================================================
-- 1. Fix helper functions used by RLS policies
-- ============================================================================

-- Fix is_instructor_for_class
create or replace function public.is_instructor_for_class(target_class_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.classes c
    where c.id = target_class_id
      and c.teacher_id = (select auth.uid())
  );
$$;

-- Fix is_instructor_for_session
create or replace function public.is_instructor_for_session(target_session_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.class_sessions s
    join public.classes c on c.id = s.class_id
    where s.id = target_session_id
      and c.teacher_id = (select auth.uid())
  );
$$;

-- Fix is_instructor_for_quiz
create or replace function public.is_instructor_for_quiz(target_quiz_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.quizzes q
    join public.classes c on c.id = q.class_id
    where q.id = target_quiz_id
      and c.teacher_id = (select auth.uid())
  );
$$;

-- Fix is_instructor_for_question
create or replace function public.is_instructor_for_question(target_question_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    join public.classes c on c.id = q.class_id
    where qq.id = target_question_id
      and c.teacher_id = (select auth.uid())
  );
$$;

-- Fix is_instructor_for_attempt
create or replace function public.is_instructor_for_attempt(target_attempt_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.quiz_attempts qa
    join public.quizzes q on q.id = qa.quiz_id
    join public.classes c on c.id = q.class_id
    where qa.id = target_attempt_id
      and c.teacher_id = (select auth.uid())
  );
$$;

-- Fix is_instructor_for_student
create or replace function public.is_instructor_for_student(target_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.user_id = target_user_id
      and c.teacher_id = (select auth.uid())
  );
$$;

-- Fix can_instructor_read_profile
create or replace function public.can_instructor_read_profile(target_user_id uuid)
returns boolean
language sql
stable
as $$
  select
    target_user_id = (select auth.uid())
    or exists (
      select 1
      from public.enrollments e
      join public.classes c on c.id = e.class_id
      where e.user_id = target_user_id
        and c.teacher_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.class_sessions s
      join public.classes c on c.id = s.class_id
      where s.created_by = target_user_id
        and c.teacher_id = (select auth.uid())
    );
$$;

-- ============================================================================
-- 2. Fix profiles table policies
-- ============================================================================

-- Fix profiles_select_self_or_admin (the one causing the warning!)
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
using (
  id = (select auth.uid()) 
  OR 
  is_admin((select auth.uid()))
);

-- Fix profiles_update_self
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Fix profiles_update_admin
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles
for update
using (is_admin((select auth.uid())))
with check (is_admin((select auth.uid())));

-- ============================================================================
-- 3. Fix direct policy usage in instructor_enrollments
-- ============================================================================

drop policy if exists instructor_enrollments_student_manage on public.instructor_enrollments;
create policy instructor_enrollments_student_manage
on public.instructor_enrollments
for all
using (student_id = (select auth.uid()))
with check (student_id = (select auth.uid()));

drop policy if exists instructor_enrollments_instructor_read on public.instructor_enrollments;
create policy instructor_enrollments_instructor_read
on public.instructor_enrollments
for select
using (instructor_id = (select auth.uid()));

drop policy if exists instructor_enrollments_admin_manage on public.instructor_enrollments;
create policy instructor_enrollments_admin_manage
on public.instructor_enrollments
for all
using (is_admin((select auth.uid())))
with check (is_admin((select auth.uid())));

-- ============================================================================
-- 4. Fix policies that use is_admin(auth.uid())
-- ============================================================================

drop policy if exists "classes_instructor_manage" on public.classes;
create policy "classes_instructor_manage"
on public.classes
for all
using (
  is_admin((select auth.uid())) OR is_instructor_for_class(id)
)
with check (
  is_admin((select auth.uid())) OR is_instructor_for_class(id)
);

drop policy if exists "sessions_instructor_manage" on public.class_sessions;
create policy "sessions_instructor_manage"
on public.class_sessions
for all
using (
  is_admin((select auth.uid())) OR is_instructor_for_class(class_id)
)
with check (
  is_admin((select auth.uid())) OR is_instructor_for_class(class_id)
);

drop policy if exists "quizzes_instructor_manage" on public.quizzes;
create policy "quizzes_instructor_manage"
on public.quizzes
for all
using (
  is_admin((select auth.uid())) OR is_instructor_for_class(class_id)
)
with check (
  is_admin((select auth.uid())) OR is_instructor_for_class(class_id)
);

drop policy if exists "quiz_questions_instructor_manage" on public.quiz_questions;
create policy "quiz_questions_instructor_manage"
on public.quiz_questions
for all
using (
  is_admin((select auth.uid())) OR is_instructor_for_quiz(quiz_id)
)
with check (
  is_admin((select auth.uid())) OR is_instructor_for_quiz(quiz_id)
);

drop policy if exists "quiz_options_instructor_manage" on public.quiz_options;
create policy "quiz_options_instructor_manage"
on public.quiz_options
for all
using (
  is_admin((select auth.uid())) OR is_instructor_for_question(question_id)
)
with check (
  is_admin((select auth.uid())) OR is_instructor_for_question(question_id)
);

drop policy if exists "quiz_attempts_instructor_read" on public.quiz_attempts;
create policy "quiz_attempts_instructor_read"
on public.quiz_attempts
for select
using (
  is_admin((select auth.uid())) OR is_instructor_for_quiz(quiz_id)
);

drop policy if exists "quiz_answers_instructor_read" on public.quiz_answers;
create policy "quiz_answers_instructor_read"
on public.quiz_answers
for select
using (
  is_admin((select auth.uid())) OR is_instructor_for_attempt(attempt_id)
);

drop policy if exists "quiz_retake_requests_instructor_manage" on public.quiz_retake_requests;
create policy "quiz_retake_requests_instructor_manage"
on public.quiz_retake_requests
for all
using (
  is_admin((select auth.uid())) OR is_instructor_for_quiz(quiz_id)
)
with check (
  is_admin((select auth.uid())) OR is_instructor_for_quiz(quiz_id)
);

