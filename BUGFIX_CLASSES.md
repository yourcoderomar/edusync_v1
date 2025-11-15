# Bug Fix: Classes Page Failing to Fetch

## 🐛 Problem
Classes page failed to load any classes. The query was returning an error because it was trying to join with a non-existent foreign key.

## 🔍 Root Cause

The `getClasses()` and `getClassById()` actions were using incorrect foreign key references:

### Database Schema:
```sql
classes (
  id uuid,
  name text,
  description text,
  created_by uuid,           -- ✅ Correct column name
  created_at timestamptz,
  
  FOREIGN KEY: classes_created_by_fkey  -- ✅ Correct FK name
    REFERENCES profiles(id)
)
```

### Code Was Using (WRONG):
```typescript
teacher:profiles!classes_teacher_id_fkey(id, full_name, email)
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^
                 This foreign key doesn't exist!
```

**Issues:**
1. ❌ Foreign key `classes_teacher_id_fkey` doesn't exist (should be `classes_created_by_fkey`)
2. ❌ Column `teacher_id` doesn't exist (should be `created_by`)
3. ❌ Profiles table doesn't have `email` column (email is in `auth.users`)

## 🔧 Fix Applied

### 1. Fixed `src/lib/actions/classes/get-classes.ts`

**Before:**
```typescript
.select(`
  *,
  teacher:profiles!classes_teacher_id_fkey(id, full_name, email)
`)
```

**After:**
```typescript
.select(`
  *,
  creator:profiles!classes_created_by_fkey(id, full_name, phone, role)
`)
```

### 2. Fixed `src/app/(protected)/admin/classes/[classId]/page.tsx`

**Before:**
```typescript
const teacher = classData.teacher as any

<span className="font-medium">Teacher:</span> {teacher?.full_name || 'Unknown'}
```

**After:**
```typescript
const creator = classData.creator as any

<span className="font-medium">Created by:</span> {creator?.full_name || 'Unknown'}
```

## ✅ Result
- ✅ Classes now load correctly on `/admin/classes`
- ✅ Class details page now works on `/admin/classes/[classId]`
- ✅ Proper foreign key reference used
- ✅ No more query errors
- ✅ Creator information displays correctly (when available)

## 📊 Verified Data
Database has **6 classes** ready to display:
```sql
SELECT id, name, description, created_by FROM classes;
-- Returns 6 rows ✅
```

## 💡 Lessons Learned
1. **Always check database foreign key names** - they might not match your expectations
2. **Use database inspection tools** to verify schema before writing queries
3. **Column naming matters** - `created_by` vs `teacher_id` are semantically similar but different in the schema
4. **Remember that email is in auth.users**, not in profiles table

## 🎯 Related Fixes
This is similar to the student data bug where we were also querying wrong column names:
- Student enrollments: `student_id` → `user_id`
- Profile pictures: `picture_url` → `profile_picture_url`
- Profile email: Removed (not in profiles table)

## 🔄 Pattern
All these bugs stem from **assuming column names** instead of **verifying the actual database schema**. 

**Solution:** Always inspect the database schema first! 🔍

