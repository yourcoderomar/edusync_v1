# 🔑 Setup Supabase Service Role Key

## ⚠️ CRITICAL: This is required for user signup to work!

The service role key is needed to bypass RLS (Row Level Security) policies when creating user profiles during signup.

---

## 📋 Step-by-Step Instructions

### 1. Get Your Service Role Key from Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `aqgqiipiposiuiulnjcl`
3. Click on **Settings** (gear icon) in the left sidebar
4. Click on **API** section
5. Scroll down to **Project API keys**
6. Find the **`service_role`** key (⚠️ NOT the `anon` key!)
7. Click the **Copy** button next to it

### 2. Add to Your `.env.local` File

Open your `.env.local` file (in the root of your project) and add:

```env
# ⚠️ NEVER commit this to Git - it has full database access!
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://aqgqiipiposiuiulnjcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZ3FpaXBpcG9zaXVpdWxuamNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYzOTU4NDkwMCwiZXhwIjoxOTU1MTYwOTAwfQ...

NEXT_PUBLIC_APP_NAME=EduSync
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_DESCRIPTION=Educational platform for managing classes, sessions, and student progress
```

### 3. Restart Your Development Server

After adding the key, **you MUST restart** your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🔒 Security Notes

### ⚠️ EXTREMELY IMPORTANT

- **NEVER** commit `.env.local` to Git
- **NEVER** share your service role key
- **NEVER** use it in client-side code
- ✅ `.env.local` is already in `.gitignore`

### What the Service Role Key Does

- 🔓 **Bypasses ALL Row Level Security (RLS) policies**
- 🔑 **Has full admin access to your database**
- 🛡️ **Only used server-side in secure operations**

### When We Use It

In this app, the service role key is ONLY used for:
1. ✅ Creating user profiles during signup
2. ✅ Admin operations that require elevated permissions

---

## ✅ Testing After Setup

1. Add the `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
2. Restart the dev server
3. Go to the signup page
4. Create a new account with:
   - Full name
   - Phone number
   - Parent phone number
   - Profile picture (optional)
   - Email
   - Password
5. Submit the form
6. ✅ You should now be redirected to the student dashboard
7. ✅ Check Supabase → Authentication → Users (auth user created)
8. ✅ Check Supabase → Table Editor → profiles (profile created with all data)

---

## 🐛 Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY is not configured"
**Solution:** Make sure you added the key to `.env.local` and restarted the server.

### Error: "Failed to create profile: [specific error]"
**Solution:** Check the console for detailed error logs. Common issues:
- Column name mismatch (check database schema)
- Foreign key constraints
- Database trigger conflicts

### Profile Still Not Created
1. Check Supabase logs (Dashboard → Logs)
2. Verify the `profiles` table exists
3. Check if there's a database trigger that might conflict
4. Verify the service role key is correct

---

## 📚 Additional Resources

- [Supabase Service Role Key Docs](https://supabase.com/docs/guides/api/api-keys)
- [Row Level Security (RLS) Docs](https://supabase.com/docs/guides/auth/row-level-security)





