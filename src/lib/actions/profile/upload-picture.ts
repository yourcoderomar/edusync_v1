'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logError } from '@/lib/utils/errors'

/**
 * Upload profile picture server action
 * 
 * @security
 * - Validates user authentication
 * - Uses admin client for storage upload (bypasses RLS)
 * - Updates profile with picture URL
 */
export async function uploadProfilePicture(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'You must be logged in to upload a profile picture',
      }
    }

    const profilePictureFile = formData.get('profilePicture') as File | null

    console.log('📷 Profile picture file received:', {
      hasFile: !!profilePictureFile,
      fileName: profilePictureFile?.name,
      fileSize: profilePictureFile?.size,
      fileType: profilePictureFile?.type,
    })

    if (!profilePictureFile || profilePictureFile.size === 0) {
      console.error('❌ No profile picture file provided')
      return {
        success: false,
        error: 'Please select a profile picture',
      }
    }

    // Validate file size (max 5MB)
    if (profilePictureFile.size > 5 * 1024 * 1024) {
      console.error('❌ File too large:', profilePictureFile.size)
      return {
        success: false,
        error: 'Image size must be less than 5MB',
      }
    }

    // Validate file type
    if (!profilePictureFile.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', profilePictureFile.type)
      return {
        success: false,
        error: 'Please select a valid image file',
      }
    }

    // Generate filename with user folder structure (required by RLS policy)
    const fileExt = profilePictureFile.name.split('.').pop()
    const fileName = `profile.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    console.log('⬆️ Uploading profile picture to:', filePath)
    console.log('📦 File details:', {
      path: filePath,
      size: profilePictureFile.size,
      type: profilePictureFile.type,
      name: profilePictureFile.name,
    })

    // Use admin client for storage upload (bypasses RLS)
    let adminClient
    try {
      adminClient = createAdminClient()
      console.log('✅ Admin client created successfully')
    } catch (adminError) {
      console.error('❌ Failed to create admin client:', adminError)
      return {
        success: false,
        error: 'Server configuration error. Please contact support.',
      }
    }
    
    // Upload to Supabase storage
    console.log('📤 Starting upload to storage...')
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('profile-pictures')
      .upload(filePath, profilePictureFile, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting existing profile picture
      })

    if (uploadError) {
      console.error('❌ Profile picture upload error:', uploadError)
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2))
      logError(uploadError, 'uploadProfilePicture - upload error')
      return {
        success: false,
        error: `Failed to upload profile picture: ${uploadError.message || 'Unknown error'}. Please check console for details.`,
      }
    }

    console.log('✅ Upload successful, upload data:', uploadData)

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)

    const profilePictureUrl = urlData.publicUrl
    console.log('✅ Profile picture uploaded successfully:', profilePictureUrl)

    // Update profile with picture URL using admin client
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ profile_picture_url: profilePictureUrl } as never)
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Failed to update profile picture URL:', updateError)
      logError(updateError, 'uploadProfilePicture - update error')
      return {
        success: false,
        error: 'Failed to update profile. Please try again.',
      }
    }

    console.log('✅ Profile picture URL updated successfully')

    // Revalidate and redirect to dashboard
    revalidatePath('/', 'layout')
    
    // Get user role to determine redirect
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const typedProfile = profile as { role: 'admin' | 'student' | 'instructor' } | null
    const redirectPath = typedProfile && (typedProfile.role === 'admin' || typedProfile.role === 'instructor')
      ? '/admin/dashboard'
      : '/student/dashboard'
    
    redirect(redirectPath)
  } catch (error) {
    // redirect() throws a special error that should not be caught
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    
    logError(error, 'uploadProfilePicture')
    console.error('Upload profile picture error:', error)
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

