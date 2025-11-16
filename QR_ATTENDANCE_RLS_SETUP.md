# QR Code Attendance - RLS Policy Setup

## Issue
If you're getting "Failed to mark attendance" when students scan the QR code, it's likely due to Row Level Security (RLS) policies on the `attendance` table that don't allow students to insert their own attendance records.

## Solution

You need to add an RLS policy in Supabase that allows students to insert/update their own attendance records.

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
-- Allow students to insert their own attendance records
CREATE POLICY "Students can insert their own attendance"
ON attendance
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow if the student_id matches the authenticated user
  student_id = auth.uid()
  AND
  -- Only allow if they're a student (not admin)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'student'
  )
  AND
  -- Only allow if they're enrolled in the class for this session
  EXISTS (
    SELECT 1 FROM class_sessions cs
    INNER JOIN enrollments e ON e.class_id = cs.class_id
    WHERE cs.id = attendance.session_id
    AND e.user_id = auth.uid()
  )
);

-- Allow students to update their own attendance records (if already exists)
CREATE POLICY "Students can update their own attendance"
ON attendance
FOR UPDATE
TO authenticated
USING (
  -- Only allow if the student_id matches the authenticated user
  student_id = auth.uid()
  AND
  -- Only allow if they're a student
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'student'
  )
)
WITH CHECK (
  -- Ensure they can only update their own records
  student_id = auth.uid()
);
```

### Alternative: Simpler Policy (Less Secure)

If you want a simpler policy that's less restrictive (students can mark attendance for any session they're enrolled in):

```sql
-- Simpler policy: Allow students to insert/update their own attendance
CREATE POLICY "Students can manage their own attendance"
ON attendance
FOR ALL
TO authenticated
USING (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'student'
  )
)
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'student'
  )
);
```

## Verify RLS is Enabled

Make sure RLS is enabled on the attendance table:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'attendance';

-- If rowsecurity is false, enable it:
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
```

## Testing

After adding the policy, test by:
1. Logging in as a student
2. Scanning a QR code for a session they're enrolled in
3. Attendance should be marked successfully

## Troubleshooting

If you still get errors after adding the policy:

1. **Check the browser console** - The improved error logging will show the actual database error
2. **Check Supabase logs** - Go to Logs > Postgres Logs to see detailed error messages
3. **Verify enrollment** - Make sure the student is actually enrolled in the class
4. **Check session date** - The code prevents marking attendance for future sessions or sessions older than 24 hours

## Error Codes Reference

- `42501` - Permission denied (RLS policy blocking)
- `23503` - Foreign key violation
- `23505` - Unique constraint violation (already exists)

