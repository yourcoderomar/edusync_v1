# Supabase Storage Setup Guide

## Profile Pictures Bucket Configuration

The EduSync application requires a Supabase storage bucket for storing user profile pictures.

### Creating the Bucket

1. **Go to Supabase Dashboard**
   - Navigate to your project: `aqgqiipiposiuiulnjcl`
   - Go to **Storage** section in the left sidebar

2. **Create New Bucket**
   - Click "New bucket"
   - **Bucket name**: `profile-pictures`
   - **Public bucket**: ✅ **YES** (Check this option)
   - Click "Create bucket"

3. **Configure Bucket Policies (Optional)**
   
   If you need more fine-grained control, you can set up RLS policies:

   ```sql
   -- Allow authenticated users to upload their own profile pictures
   CREATE POLICY "Users can upload their own profile picture"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'profile-pictures' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );

   -- Allow authenticated users to update their own profile pictures
   CREATE POLICY "Users can update their own profile picture"
   ON storage.objects
   FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'profile-pictures' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );

   -- Allow public read access to all profile pictures
   CREATE POLICY "Public read access to profile pictures"
   ON storage.objects
   FOR SELECT
   TO public
   USING (bucket_id = 'profile-pictures');
   ```

### Bucket Settings

- **Bucket ID**: `profile-pictures`
- **Public Access**: Enabled (for viewing images)
- **File Size Limit**: 5MB (enforced in application)
- **Allowed File Types**: Images (JPG, PNG, GIF, WebP)

### Folder Structure

```
profile-pictures/
  ├── {user-id}-{timestamp}.jpg
  ├── {user-id}-{timestamp}.png
  └── ...
```

Each file is named with:
- User ID (UUID)
- Timestamp (to prevent caching issues)
- Original file extension

### Testing the Bucket

After creating the bucket, you can test it by:
1. Going to the signup page
2. Creating a new account with a profile picture
3. Checking if the image appears in the user's profile

### Important Notes

- ✅ Images are automatically uploaded during signup
- ✅ The URL is saved to `profiles.profile_picture_url`
- ✅ Images are publicly accessible (for displaying in the app)
- ⚠️ File size is limited to 5MB on the client side
- ⚠️ Only image files are accepted (validated on upload)

### Verifying Configuration

Check that `next.config.ts` includes the Supabase storage domain:

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

✅ This is already configured in your project!

