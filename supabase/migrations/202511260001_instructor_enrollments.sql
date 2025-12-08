-- Migration: Create instructor_enrollments table
-- Description:
--   1. Adds a simple instructor_enrollments table to track which instructor
--      a student is enrolled with
--   2. Enables RLS and basic policies so students can manage their own
--      instructor enrollments and instructors/admins can read them

create table if not exists public.instructor_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

alter table public.instructor_enrollments
  add constraint instructor_enrollments_status_check
  check (status = any (array['pending'::text, 'approved'::text, 'rejected'::text]));

create index if not exists idx_instructor_enrollments_student
  on public.instructor_enrollments(student_id);

create index if not exists idx_instructor_enrollments_instructor
  on public.instructor_enrollments(instructor_id);

alter table public.instructor_enrollments
  enable row level security;

-- Students: can see and insert their own instructor enrollments
drop policy if exists instructor_enrollments_student_manage on public.instructor_enrollments;
create policy instructor_enrollments_student_manage
on public.instructor_enrollments
for all
using (student_id = auth.uid())
with check (student_id = auth.uid());

-- Instructors: can read enrollments where they are the instructor
drop policy if exists instructor_enrollments_instructor_read on public.instructor_enrollments;
create policy instructor_enrollments_instructor_read
on public.instructor_enrollments
for select
using (instructor_id = auth.uid());

-- Admins: full access via is_admin helper
drop policy if exists instructor_enrollments_admin_manage on public.instructor_enrollments;
create policy instructor_enrollments_admin_manage
on public.instructor_enrollments
for all
using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));













