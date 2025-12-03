-- Migration: Add assignments with three modes (freeform, structured, bulk MCQ)
-- Description:
--   1. Create assignments core tables
--   2. Add indexes for optimized queries
--   3. Add RLS policies aligned with existing quizzes/attendance patterns
-- 
-- Tables:
--   - assignments
--   - assignment_questions
--   - assignment_options
--   - assignment_submissions

-- ============================================================================
-- 1. Core tables
-- ============================================================================

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions(id) on delete cascade,
  mode text not null check (mode in ('freeform', 'structured', 'bulk_mcq')),
  title text not null,
  instructions text,
  due_at timestamptz,
  max_points integer,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignment_questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  question_text text not null,
  question_type public.question_type not null default 'multiple_choice',
  points integer not null default 1,
  order_number integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.assignment_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  order_number integer not null
);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id),
  submitted_at timestamptz not null default now(),
  content text,
  grade numeric,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

-- ============================================================================
-- 2. Helpful indexes
-- ============================================================================

create index if not exists idx_assignments_session_id
  on public.assignments (session_id);

create index if not exists idx_assignments_due_at
  on public.assignments (due_at);

create index if not exists idx_assignment_questions_assignment_id
  on public.assignment_questions (assignment_id);

create index if not exists idx_assignment_options_question_id
  on public.assignment_options (question_id);

create index if not exists idx_assignment_submissions_assignment_id
  on public.assignment_submissions (assignment_id);

create index if not exists idx_assignment_submissions_student_id
  on public.assignment_submissions (student_id);

-- ============================================================================
-- 3. RLS: enable and policies
-- ============================================================================

alter table public.assignments enable row level security;
alter table public.assignment_questions enable row level security;
alter table public.assignment_options enable row level security;
alter table public.assignment_submissions enable row level security;

-- Helper: instructor for assignment via session/class
create or replace function public.is_instructor_for_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.assignments a
    join public.class_sessions s on s.id = a.session_id
    join public.classes c on c.id = s.class_id
    where a.id = target_assignment_id
      and c.teacher_id = auth.uid()
  );
$$;

-- Helper: instructor for assignment question
create or replace function public.is_instructor_for_assignment_question(target_question_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.assignment_questions q
    join public.assignments a on a.id = q.assignment_id
    join public.class_sessions s on s.id = a.session_id
    join public.classes c on c.id = s.class_id
    where q.id = target_question_id
      and c.teacher_id = auth.uid()
  );
$$;

-- Helper: instructor for assignment submission
create or replace function public.is_instructor_for_assignment_submission(target_submission_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.assignment_submissions sub
    join public.assignments a on a.id = sub.assignment_id
    join public.class_sessions s on s.id = a.session_id
    join public.classes c on c.id = s.class_id
    where sub.id = target_submission_id
      and c.teacher_id = auth.uid()
  );
$$;

-- --------------------------------------------------------------------------
-- assignments policies
-- --------------------------------------------------------------------------

-- SELECT: students in enrolled classes OR admins/instructors for the class
create policy if not exists "assignments_select_consolidated"
on public.assignments
for select
using (
  -- Student: must be enrolled in the class for the session
  exists (
    select 1
    from public.class_sessions s
    join public.enrollments e on e.class_id = s.class_id
    where s.id = assignments.session_id
      and e.user_id = (select auth.uid())
  )
  or
  -- Admin / Instructor
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or exists (
    select 1
    from public.class_sessions s2
    join public.classes c2 on c2.id = s2.class_id
    where s2.id = assignments.session_id
      and c2.teacher_id = (select auth.uid())
  )
);

-- INSERT: admin or instructor for the class
create policy if not exists "assignments_insert_consolidated"
on public.assignments
for insert
with check (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or exists (
    select 1
    from public.class_sessions s
    join public.classes c on c.id = s.class_id
    where s.id = assignments.session_id
      and c.teacher_id = (select auth.uid())
  )
);

-- UPDATE: admin or instructor for the class
create policy if not exists "assignments_update_consolidated"
on public.assignments
for update
using (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or exists (
    select 1
    from public.class_sessions s
    join public.classes c on c.id = s.class_id
    where s.id = assignments.session_id
      and c.teacher_id = (select auth.uid())
  )
)
with check (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or exists (
    select 1
    from public.class_sessions s
    join public.classes c on c.id = s.class_id
    where s.id = assignments.session_id
      and c.teacher_id = (select auth.uid())
  )
);

-- DELETE: admin or instructor for the class
create policy if not exists "assignments_delete_consolidated"
on public.assignments
for delete
using (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or exists (
    select 1
    from public.class_sessions s
    join public.classes c on c.id = s.class_id
    where s.id = assignments.session_id
      and c.teacher_id = (select auth.uid())
  )
);

-- --------------------------------------------------------------------------
-- assignment_questions policies
-- --------------------------------------------------------------------------

-- SELECT: students in enrolled classes OR admins/instructors
create policy if not exists "assignment_questions_select_consolidated"
on public.assignment_questions
for select
using (
  -- Student
  exists (
    select 1
    from public.assignment_questions q
    join public.assignments a on a.id = q.assignment_id
    join public.class_sessions s on s.id = a.session_id
    join public.enrollments e on e.class_id = s.class_id
    where q.id = assignment_questions.id
      and e.user_id = (select auth.uid())
  )
  or
  -- Admin / Instructor
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment_question(id)
);

-- INSERT: admin/instructor for assignment
create policy if not exists "assignment_questions_insert_consolidated"
on public.assignment_questions
for insert
with check (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment(assignment_id)
);

-- UPDATE: admin/instructor for assignment
create policy if not exists "assignment_questions_update_consolidated"
on public.assignment_questions
for update
using (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment_question(id)
)
with check (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment_question(id)
);

-- DELETE: admin/instructor for assignment
create policy if not exists "assignment_questions_delete_consolidated"
on public.assignment_questions
for delete
using (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment_question(id)
);

-- --------------------------------------------------------------------------
-- assignment_options policies
-- --------------------------------------------------------------------------

-- SELECT: students reading questions OR admins/instructors
create policy if not exists "assignment_options_select_consolidated"
on public.assignment_options
for select
using (
  -- Student: can read options for assignments they can see
  exists (
    select 1
    from public.assignment_options o
    join public.assignment_questions q on q.id = o.question_id
    join public.assignments a on a.id = q.assignment_id
    join public.class_sessions s on s.id = a.session_id
    join public.enrollments e on e.class_id = s.class_id
    where o.id = assignment_options.id
      and e.user_id = (select auth.uid())
  )
  or
  -- Admin / Instructor
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or exists (
    select 1
    from public.assignment_options o2
    join public.assignment_questions q2 on q2.id = o2.question_id
    join public.assignments a2 on a2.id = q2.assignment_id
    join public.class_sessions s2 on s2.id = a2.session_id
    join public.classes c2 on c2.id = s2.class_id
    where o2.id = assignment_options.id
      and c2.teacher_id = (select auth.uid())
  )
);

-- INSERT: admin/instructor for assignment
create policy if not exists "assignment_options_insert_consolidated"
on public.assignment_options
for insert
with check (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment_question(question_id)
);

-- UPDATE: admin/instructor for assignment
create policy if not exists "assignment_options_update_consolidated"
on public.assignment_options
for update
using (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment_question(question_id)
)
with check (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment_question(question_id)
);

-- DELETE: admin/instructor for assignment
create policy if not exists "assignment_options_delete_consolidated"
on public.assignment_options
for delete
using (
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment_question(question_id)
);

-- --------------------------------------------------------------------------
-- assignment_submissions policies
-- --------------------------------------------------------------------------

-- SELECT: student can see own submissions; instructors/admins can see all in their classes
create policy if not exists "assignment_submissions_select_consolidated"
on public.assignment_submissions
for select
using (
  -- Student own submission
  student_id = (select auth.uid())
  or
  -- Admin / Instructor
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or exists (
    select 1
    from public.assignment_submissions sub
    join public.assignments a on a.id = sub.assignment_id
    join public.class_sessions s on s.id = a.session_id
    join public.classes c on c.id = s.class_id
    where sub.id = assignment_submissions.id
      and c.teacher_id = (select auth.uid())
  )
);

-- INSERT: only the student for themselves
create policy if not exists "assignment_submissions_insert_consolidated"
on public.assignment_submissions
for insert
with check (
  student_id = (select auth.uid())
);

-- UPDATE: student can update own submission (e.g., resubmit) OR instructor/admin for grading
create policy if not exists "assignment_submissions_update_consolidated"
on public.assignment_submissions
for update
using (
  -- Student can update their own record
  student_id = (select auth.uid())
  or
  -- Admin/Instructor grading
  current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment_submission(id)
)
with check (
  student_id = (select auth.uid())
  or current_user_role() = 'admin'
  or is_admin((select auth.uid()))
  or is_instructor_for_assignment_submission(id)
);

-- DELETE: only student can delete their submission (optional; keep strict)
create policy if not exists "assignment_submissions_delete_consolidated"
on public.assignment_submissions
for delete
using (
  student_id = (select auth.uid())
);


