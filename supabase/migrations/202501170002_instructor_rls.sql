-- Migration: Instructor-aware RLS policies and helper functions
-- Description:
--   1. Adds helper functions to detect instructor ownership
--   2. Extends RLS policies to grant instructors CRUD access to their classes
--      and related data (sessions, enrollments, attendance, quizzes, etc.)

create or replace function public.is_instructor(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = uid and p.role = 'instructor'
  );
$$;

create or replace function public.is_instructor_for_class(target_class_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.classes c
    where c.id = target_class_id
      and c.teacher_id = auth.uid()
  );
$$;

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
      and c.teacher_id = auth.uid()
  );
$$;

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
      and c.teacher_id = auth.uid()
  );
$$;

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
      and c.teacher_id = auth.uid()
  );
$$;

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
      and c.teacher_id = auth.uid()
  );
$$;

drop policy if exists "classes_instructor_manage" on public.classes;
create policy "classes_instructor_manage"
on public.classes
for all
using (
  is_admin(auth.uid()) OR is_instructor_for_class(id)
)
with check (
  is_admin(auth.uid()) OR is_instructor_for_class(id)
);

drop policy if exists "sessions_instructor_manage" on public.class_sessions;
create policy "sessions_instructor_manage"
on public.class_sessions
for all
using (
  is_admin(auth.uid()) OR is_instructor_for_class(class_id)
)
with check (
  is_admin(auth.uid()) OR is_instructor_for_class(class_id)
);

drop policy if exists "enrollment_requests_instructor_manage" on public.enrollment_requests;
create policy "enrollment_requests_instructor_manage"
on public.enrollment_requests
for all
using (
  is_instructor_for_class(class_id)
)
with check (
  is_instructor_for_class(class_id)
);

drop policy if exists "enrollments_instructor_manage" on public.enrollments;
create policy "enrollments_instructor_manage"
on public.enrollments
for all
using (
  is_instructor_for_class(class_id)
)
with check (
  is_instructor_for_class(class_id)
);

drop policy if exists "attendance_instructor_manage" on public.attendance;
create policy "attendance_instructor_manage"
on public.attendance
for all
using (
  is_instructor_for_session(session_id)
)
with check (
  is_instructor_for_session(session_id)
);

drop policy if exists "quizzes_instructor_manage" on public.quizzes;
create policy "quizzes_instructor_manage"
on public.quizzes
for all
using (
  is_admin(auth.uid()) OR is_instructor_for_class(class_id)
)
with check (
  is_admin(auth.uid()) OR is_instructor_for_class(class_id)
);

drop policy if exists "quiz_questions_instructor_manage" on public.quiz_questions;
create policy "quiz_questions_instructor_manage"
on public.quiz_questions
for all
using (
  is_admin(auth.uid()) OR is_instructor_for_quiz(quiz_id)
)
with check (
  is_admin(auth.uid()) OR is_instructor_for_quiz(quiz_id)
);

drop policy if exists "quiz_options_instructor_manage" on public.quiz_options;
create policy "quiz_options_instructor_manage"
on public.quiz_options
for all
using (
  is_admin(auth.uid()) OR is_instructor_for_question(question_id)
)
with check (
  is_admin(auth.uid()) OR is_instructor_for_question(question_id)
);

drop policy if exists "quiz_attempts_instructor_read" on public.quiz_attempts;
create policy "quiz_attempts_instructor_read"
on public.quiz_attempts
for select
using (
  is_admin(auth.uid()) OR is_instructor_for_quiz(quiz_id)
);

drop policy if exists "quiz_answers_instructor_read" on public.quiz_answers;
create policy "quiz_answers_instructor_read"
on public.quiz_answers
for select
using (
  is_admin(auth.uid()) OR is_instructor_for_attempt(attempt_id)
);

drop policy if exists "quiz_retake_requests_instructor_manage" on public.quiz_retake_requests;
create policy "quiz_retake_requests_instructor_manage"
on public.quiz_retake_requests
for all
using (
  is_admin(auth.uid()) OR is_instructor_for_quiz(quiz_id)
)
with check (
  is_admin(auth.uid()) OR is_instructor_for_quiz(quiz_id)
);

