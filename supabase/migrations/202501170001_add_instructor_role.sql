-- Migration: add instructor role and enforce class instructor relationships
-- Description:
--   1. Allows 'instructor' in profiles.role check constraint
--   2. Ensures classes.teacher_id references profiles(id)
--   3. Adds helpful index for instructor lookups

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role = ANY (ARRAY['admin'::text, 'student'::text, 'instructor'::text]));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'classes'
      AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'classes'
      AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE public.classes
      RENAME COLUMN created_by TO teacher_id;
  END IF;
END $$;

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS teacher_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'classes_teacher_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'classes'
  ) THEN
    ALTER TABLE public.classes
      ADD CONSTRAINT classes_teacher_id_fkey
        FOREIGN KEY (teacher_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id
  ON public.classes(teacher_id);

