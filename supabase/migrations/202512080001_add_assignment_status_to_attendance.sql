-- Add assignment status to attendance so instructors can track homework completion
-- Allowed values: done, not_done, not_required (for "no assignment today")
alter table public.attendance
add column if not exists assignment_status text
  check (assignment_status in ('done', 'not_done', 'not_required'))
  default null;

comment on column public.attendance.assignment_status is
  'Manual assignment completion status for the session: done, not_done, or not_required (no assignment given)';
