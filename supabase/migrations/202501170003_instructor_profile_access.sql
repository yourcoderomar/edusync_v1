-- Migration: Allow instructors to read student profiles for their classes

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
      and c.teacher_id = auth.uid()
  );
$$;

drop policy if exists "profiles_instructor_students" on public.profiles;
create policy "profiles_instructor_students"
on public.profiles
for select
using (
  is_instructor_for_student(id)
);

