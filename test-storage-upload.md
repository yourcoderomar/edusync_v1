# Test Supabase Storage Upload

## Quick Bucket Check

### 1. Create the Bucket (if not exists)

Go to: https://supabase.com/dashboard/project/aqgqiipiposiuiulnjcl/storage/buckets

**Steps:**
1. Click "New bucket"
2. Name: `profile-pictures`
3. ✅ Check "Public bucket"
4. Click "Create"

### 2. Test Manual Upload

1. Go to Storage → `profile-pictures` bucket
2. Click "Upload file"
3. Upload any image
4. Check if it appears in the bucket
5. Click the image → Copy the public URL
6. Try opening the URL in a browser

✅ If the image loads = Storage is working!
❌ If error = Storage configuration issue

### 3. Check Bucket Policies

The bucket should be **PUBLIC** for read access.

If you need custom policies, run this SQL:

```sql
-- Allow public read access to profile pictures
CREATE POLICY "Public profile pictures are viewable by everyone"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-pictures' );

-- Allow authenticated users to upload
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'profile-pictures' );

-- Allow authenticated users to update their own profile picture
CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'profile-pictures' );
```

### 4. Verify Next.js Image Configuration

Your `next.config.ts` should already have this (already configured):

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'aqgqiipiposiuiulnjcl.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
}
```

✅ This is already set up in your project!

---

## 🐛 Debugging Steps

### Check Console Logs

When you sign up with a profile picture, you should see:

**Browser Console:**
```
📤 Form data before submit: { hasProfilePicture: true, ... }
📬 Sending FormData to server...
```

**Server Terminal:**
```
📥 Sign up form data: { hasProfilePicture: true }
📷 Profile picture file: { hasFile: true, fileName: "image.jpg", fileSize: 123456 }
⬆️ Uploading profile picture to: profile-pictures/user-id-timestamp.jpg
✅ Profile picture uploaded successfully: https://...
🖼️ Updating profile with picture URL: https://...
✅ Profile picture URL updated successfully
```

### Common Errors

**Error: "Bucket not found"**
→ Create the `profile-pictures` bucket

**Error: "Object name is empty"**
→ File extension issue, check fileName

**Error: "new row violates row-level security"**
→ Run the storage policies SQL above

**Error: "413 Payload Too Large"**
→ Image is > 5MB, resize it

---

## ✅ Expected Result

After successful upload:

1. File appears in: Storage → `profile-pictures`
2. Database: `profiles.profile_picture_url` = `https://aqgqiipiposiuiulnjcl.supabase.co/storage/v1/object/public/profile-pictures/...`
3. Image displays in the app





