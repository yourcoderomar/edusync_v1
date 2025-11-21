-- Migration: Expand instructor profile visibility to include class admins/creators

create or replace function public.can_instructor_read_profile(target_user_id uuid)
returns boolean
language sql
stable
as $$
  select
    target_user_id = auth.uid()
    or exists (
      select 1
      from public.enrollments e
      join public.classes c on c.id = e.class_id
      where e.user_id = target_user_id
        and c.teacher_id = auth.uid()
    )
    or exists (
      select 1
      from public.class_sessions s
      join public.classes c on c.id = s.class_id
      where s.created_by = target_user_id
        and c.teacher_id = auth.uid()
    );
$$;

drop policy if exists "profiles_instructor_students" on public.profiles;
create policy "profiles_instructor_access"
on public.profiles
for select
using (
  can_instructor_read_profile(id)
);



