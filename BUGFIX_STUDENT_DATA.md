# Bug Fix: Student Data Not Displaying

## 🐛 Problem
Student details page showed:
- 0 enrollments (but database had 3)
- 0 quiz attempts (but database had 5)
- Console errors: `[Error - getStudentById - enrollments]: {}`

## 🔍 Root Cause Analysis

Using Supabase MCP tools to inspect the database, I discovered **THREE critical issues**:

### Issue 1: Wrong Column Name in Enrollments Query ❌
**Database Schema:**
```sql
enrollments (
  user_id uuid,    -- ✅ Correct column name
  class_id uuid,
  enrolled_at timestamptz
)
```

**Our Code Was Using:**
```typescript
.select('id, enrolled_at, class_id')
.eq('student_id', studentId)  // ❌ WRONG! Column doesn't exist
```

**Fixed To:**
```typescript
.select('enrolled_at, class_id, user_id')
.eq('user_id', studentId)  // ✅ Correct column name
```

### Issue 2: Wrong Column Name in Quiz Attempts Query ❌
**Database Schema:**
```sql
quiz_attempts (
  id uuid,
  quiz_id uuid,
  student_id uuid,
  started_at timestamptz,
  submitted_at timestamptz,
  score integer
  -- NO 'status' column!
)
```

**Our Code Was Using:**
```typescript
.select('id, score, status, started_at, submitted_at')
```

**Fixed To:**
```typescript
.select('id, score, started_at, submitted_at, quiz_id')
```

And added a helper function to derive status from the data:
```typescript
function getAttemptStatus(attempt: any): 'graded' | 'submitted' | 'in_progress' {
  if (!attempt.submitted_at) return 'in_progress'
  if (attempt.score !== null) return 'graded'
  return 'submitted'
}
```

### Issue 3: Wrong Column Names in Profiles Query ❌
**Database Schema:**
```sql
profiles (
  id uuid,
  full_name text,
  phone text,
  role text,
  created_at timestamptz,
  profile_picture_url text,  -- ✅ Correct name
  parent_phone_number text
  -- NO 'email' or 'picture_url' columns!
)
```

**Note:** Email is stored in `auth.users` table, which can't be accessed directly from client queries for security.

**Our Code Was Using:**
```typescript
.select('id, email, full_name, picture_url')  // ❌ WRONG columns
```

**Fixed To:**
```typescript
.select('id, full_name, profile_picture_url, phone, role')  // ✅ Correct columns
```

## 🔧 Files Modified

### 1. `src/lib/actions/students/get-students.ts`
- ✅ Fixed `getStudentById()` to use `user_id` instead of `student_id` for enrollments
- ✅ Removed `status` from quiz_attempts select (doesn't exist)
- ✅ Added `quiz_id` to quiz_attempts select
- ✅ Fixed `getStudentsByClass()` to use `user_id` instead of `student_id`
- ✅ Updated profiles select to use correct column names
- ✅ Kept proper error logging for real errors only

### 2. `src/app/(protected)/admin/students/[studentId]/page.tsx`
- ✅ Added `getAttemptStatus()` helper function to derive status from data
- ✅ Replaced all `attempt.status` references with `getAttemptStatus(attempt)`
- ✅ Fixed `student.picture_url` to `student.profile_picture_url`
- ✅ Replaced `student.email` with `student.phone` (email not available in profiles table)
- ✅ Updated metadata to not rely on email

### 3. `src/components/students/StudentCard.tsx`
- ✅ Updated TypeScript interface to use correct column names
- ✅ Fixed `student.picture_url` to `student.profile_picture_url`
- ✅ Replaced `student.email` with `student.phone`
- ✅ Fixed avatar fallback to not depend on email

## 🧪 Verification

Queried the database directly:
```sql
-- Student has 3 enrollments
SELECT * FROM enrollments WHERE user_id = 'c86da10c-8c33-4327-8cf9-04054b976763';
-- Returns 3 rows ✅

-- Student has 5 quiz attempts
SELECT * FROM quiz_attempts WHERE student_id = 'c86da10c-8c33-4327-8cf9-04054b976763';
-- Returns 5 rows ✅

-- Email is in auth.users, not profiles
SELECT id, email FROM auth.users WHERE id = 'c86da10c-8c33-4327-8cf9-04054b976763';
-- Returns: merof2003@gmail.com ✅
```

## ✅ Result
- ✅ Student enrollments now display correctly (3 classes)
- ✅ Quiz attempts now display correctly (5 attempts)
- ✅ No more console errors
- ✅ No linter errors
- ✅ All TypeScript types are correct
- ✅ Phone number displayed instead of email

## 💡 Lesson Learned
**Always verify database schema before writing queries!** 

The issue wasn't with error handling or logging - it was simply querying columns that **don't exist** in the database, causing Supabase to return empty results.

## 🎯 Next Steps
If you need to display email addresses:
1. Create a database view or function that joins `profiles` with `auth.users`
2. Or fetch email separately using Supabase Admin API
3. Or store email in `profiles` table during user registration (recommended)

