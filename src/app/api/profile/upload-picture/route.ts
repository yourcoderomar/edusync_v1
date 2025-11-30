import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API route for uploading profile picture
 * 
 * @security
 * - Validates user authentication
 * - Uses authenticated client (respects RLS policies)
 * - RLS allows users to upload to their own folder and update their own profile
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to upload a profile picture' },
        { status: 401 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const profilePictureFile = formData.get('profilePicture') as File | null

    console.log('📷 Profile picture file received:', {
      hasFile: !!profilePictureFile,
      fileName: profilePictureFile?.name,
      fileSize: profilePictureFile?.size,
      fileType: profilePictureFile?.type,
    })

    if (!profilePictureFile || profilePictureFile.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select a profile picture' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (profilePictureFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!profilePictureFile.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Please select a valid image file' },
        { status: 400 }
      )
    }

    // Get current profile to check for existing profile picture
    const { data: currentProfileRaw } = await supabase
      .from('profiles')
      .select('profile_picture_url')
      .eq('id', user.id)
      .single()

    // Type assertion to help TypeScript understand the profile type
    const currentProfile = currentProfileRaw as { profile_picture_url: string | null } | null

    // Delete old profile picture if it exists
    if (currentProfile?.profile_picture_url) {
      try {
        // Extract file path from URL
        // URL format: https://{project-ref}.supabase.co/storage/v1/object/public/profile-pictures/{user.id}/profile.{ext}
        const url = currentProfile.profile_picture_url
        const urlParts = url.split('/profile-pictures/')
        if (urlParts.length === 2) {
          const oldFilePath = urlParts[1]
          console.log('🗑️ Deleting old profile picture:', oldFilePath)
          
          const { error: deleteError } = await supabase.storage
            .from('profile-pictures')
            .remove([oldFilePath])

          if (deleteError) {
            console.warn('⚠️ Failed to delete old profile picture:', deleteError.message)
            // Continue with upload even if deletion fails
          } else {
            console.log('✅ Old profile picture deleted successfully')
          }
        }
      } catch (error) {
        console.warn('⚠️ Error while deleting old profile picture:', error)
        // Continue with upload even if deletion fails
      }
    }

    // Generate filename with user folder structure (required by RLS policy)
    const fileExt = profilePictureFile.name.split('.').pop()
    const fileName = `profile.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    console.log('⬆️ Uploading profile picture to:', filePath)

    // Upload to Supabase storage using authenticated client
    // RLS policy allows users to upload to their own folder (userId/filename)
    console.log('📤 Starting upload to storage...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, profilePictureFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('❌ Profile picture upload error:', uploadError)
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2))
      return NextResponse.json(
        { success: false, error: `Failed to upload profile picture: ${uploadError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    console.log('✅ Upload successful, upload data:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)

    const profilePictureUrl = urlData.publicUrl
    console.log('✅ Profile picture URL:', profilePictureUrl)

    // Update profile with picture URL using authenticated client
    // RLS policy allows users to update their own profile
    console.log('🔄 Updating profile with picture URL...')
    const updatePayload: { profile_picture_url: string } = { profile_picture_url: profilePictureUrl }
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload as never)
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Failed to update profile picture URL:', updateError)
      console.error('Update error details:', JSON.stringify(updateError, null, 2))
      return NextResponse.json(
        { success: false, error: `Failed to update profile: ${updateError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    console.log('✅ Profile updated successfully')

    // Get user role to determine redirect
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ Failed to fetch profile for redirect:', profileError)
      // Default to student dashboard if we can't determine role
      return NextResponse.json({
        success: true,
        redirectPath: '/student/dashboard',
        profilePictureUrl,
      })
    }

    const redirectRole = (profile as any)?.role
    const redirectPath = redirectRole === 'admin' || redirectRole === 'instructor'
      ? '/admin/dashboard'
      : '/student/dashboard'

    return NextResponse.json({
      success: true,
      redirectPath,
      profilePictureUrl,
    })
  } catch (error) {
    console.error('❌ Upload profile picture error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

