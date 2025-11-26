-- Migration: Allow students to see instructor profiles
-- Description:
--   1. Adds an RLS policy so any authenticated user can read basic
--      profile rows where role = 'instructor'
--   2. This enables the student instructors page to list available instructors

alter table public.profiles
  enable row level security;

drop policy if exists "profiles_instructor_directory" on public.profiles;
create policy "profiles_instructor_directory"
on public.profiles
for select
to authenticated
using (role = 'instructor');


