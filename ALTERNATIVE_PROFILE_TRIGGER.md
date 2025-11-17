# 🔄 Alternative: Database Trigger for Profile Creation

If you prefer NOT to use the service role key, you can set up a database trigger that automatically creates a profile when a user signs up.

---

## ✅ Advantages of Using a Trigger

- 🔒 **More secure** - no service role key needed
- ⚡ **Automatic** - profiles created immediately on auth
- 🎯 **Database-level** - can't be bypassed
- 🛡️ **No code changes needed** - works transparently

---

## 📝 SQL Trigger Setup

Run this SQL in your Supabase SQL Editor:

### Step 1: Create the Trigger Function

```sql
-- Function to create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    parent_phone_number,
    role,
    profile_picture_url
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'parent_phone_number',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NULL -- Profile picture will be updated separately
  );
  
  RETURN NEW;
END;
$$;
```

### Step 2: Create the Trigger

```sql
-- Trigger to call the function after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 3: Grant Necessary Permissions

```sql
-- Allow the trigger to bypass RLS
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON public.profiles TO postgres;
```

---

## 🔄 Updated Signup Action (if using trigger)

If you use the database trigger approach, you can simplify the signup action:

```typescript
// src/lib/actions/auth/signup.ts

export async function signUp(formData: FormData) {
  try {
    // Extract and validate form data
    const input = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('password') as string,
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      parentPhone: formData.get('parentPhone') as string,
    }

    const validatedInput = signUpSchema.parse(input)
    const supabase = await createClient()

    // Sign up with Supabase - trigger will create profile automatically
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedInput.email,
      password: validatedInput.password,
      options: {
        data: {
          full_name: validatedInput.fullName,
          phone: validatedInput.phone,
          parent_phone_number: validatedInput.parentPhone,
          role: 'student',
        },
      },
    })

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || 'Failed to create account',
      }
    }

    // Handle profile picture upload if provided
    let profilePictureUrl: string | null = null
    const profilePictureFile = formData.get('profilePicture') as File | null

    if (profilePictureFile && profilePictureFile.size > 0) {
      // ... upload logic ...
      
      // Update profile with picture URL
      await supabase
        .from('profiles')
        .update({ profile_picture_url: profilePictureUrl })
        .eq('id', authData.user.id)
    }

    revalidatePath('/', 'layout')
    redirect('/student/dashboard')
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## 🎯 Which Approach Should You Use?

### Use Database Trigger If:
- ✅ You want maximum security
- ✅ You want automatic profile creation for ALL signups
- ✅ You don't want to manage service role keys
- ✅ You prefer database-level logic

### Use Service Role Key If:
- ✅ You need more control over profile creation
- ✅ You want to handle upload before profile creation
- ✅ You need custom validation logic
- ✅ You want everything in application code

---

## 📋 Current Implementation

**We're currently using the Service Role Key approach** because it allows us to:
1. Upload profile picture first
2. Get the URL
3. Create profile with the picture URL in one operation

But you can easily switch to the trigger approach if you prefer!

---

## 🧪 Testing the Trigger

After setting up the trigger:

1. Sign up a new user
2. Check `auth.users` table - user should exist
3. Check `profiles` table - profile should be auto-created with data from metadata
4. The profile should have all fields populated from `raw_user_meta_data`

---

## 🐛 Troubleshooting Triggers

### Check if trigger exists:
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

### Check trigger function:
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

### Test manually:
```sql
-- This will trigger the function
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name": "Test User", "phone": "+1234567890", "parent_phone_number": "+0987654321", "role": "student"}'::jsonb
);
```


