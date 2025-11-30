-- Migration: Enable RLS on enrollments table
-- Description:
--   Ensures Row Level Security is enabled on the enrollments table.
--   This is a safety check - if RLS is already enabled, this will have no effect.
--   If RLS is not enabled, this will enable it and ensure all policies are enforced.

-- Enable RLS on enrollments table (idempotent - safe to run multiple times)
alter table public.enrollments
  enable row level security;

-- Verify that RLS is enabled (this will fail if the table doesn't exist)
-- The policies should already exist from previous migrations, but we ensure RLS is on

