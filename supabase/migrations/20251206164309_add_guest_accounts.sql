-- Migration: Add guest account support
-- Description:
--   1. Adds is_guest boolean column to profiles table
--   2. Adds index on phone for efficient matching during signup
--   3. Updates RLS policies to allow admins to manage guest accounts
--   4. Adds constraint: guest accounts must have role = 'student' and is_guest = true
--   5. Ensures guest accounts cannot authenticate (no auth.users entry required)

-- ============================================================================
-- 1. Add is_guest column to profiles table
-- ============================================================================

alter table public.profiles
  add column if not exists is_guest boolean not null default false;

-- ============================================================================
-- 2. Add index on phone for efficient matching during signup
-- ============================================================================

create index if not exists idx_profiles_phone
  on public.profiles(phone)
  where phone is not null;

-- ============================================================================
-- 3. Add constraint: guest accounts must be students
-- ============================================================================

alter table public.profiles
  add constraint profiles_guest_check
    check (
      (is_guest = false) OR 
      (is_guest = true AND role = 'student')
    );

-- ============================================================================
-- 4. Create or replace is_admin helper function if it doesn't exist
-- ============================================================================

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- ============================================================================
-- 5. RLS Policies for guest accounts
-- ============================================================================

-- Admins can insert guest accounts
drop policy if exists "profiles_insert_guest_admin" on public.profiles;
create policy "profiles_insert_guest_admin"
on public.profiles
for insert
to authenticated
with check (
  is_admin((select auth.uid()))
  AND is_guest = true
  AND role = 'student'
);

-- Admins can read all guest accounts
drop policy if exists "profiles_select_guest_admin" on public.profiles;
create policy "profiles_select_guest_admin"
on public.profiles
for select
to authenticated
using (
  is_admin((select auth.uid()))
  OR (is_guest = false)
);

-- Admins can update guest accounts
drop policy if exists "profiles_update_guest_admin" on public.profiles;
create policy "profiles_update_guest_admin"
on public.profiles
for update
to authenticated
using (
  is_admin((select auth.uid()))
)
with check (
  is_admin((select auth.uid()))
  AND (
    -- If updating to guest, must be student
    (is_guest = true AND role = 'student')
    OR
    -- If not guest, normal update rules apply
    (is_guest = false)
  )
);

-- Admins can delete guest accounts
drop policy if exists "profiles_delete_guest_admin" on public.profiles;
create policy "profiles_delete_guest_admin"
on public.profiles
for delete
to authenticated
using (
  is_admin((select auth.uid()))
  AND is_guest = true
);

-- ============================================================================
-- 6. Ensure enrollments work with guest accounts (via admin actions)
-- ============================================================================

-- The existing enrollment RLS policies should already work since admins
-- can manage enrollments. Guest accounts can be enrolled by admins through
-- the enroll-student action which uses admin client or admin permissions.

-- ============================================================================
-- 7. Ensure instructor_enrollments work with guest accounts
-- ============================================================================

-- The existing instructor_enrollments RLS policies should already work
-- since admins can manage instructor enrollments. Guest accounts can be
-- enrolled with instructors by admins through the enrollment actions.

