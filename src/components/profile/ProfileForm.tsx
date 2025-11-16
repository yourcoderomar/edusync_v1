'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { updateProfile } from '@/lib/actions/profile/update-profile'
import { profileUpdateSchema, type ProfileUpdateInput } from '@/lib/validations/profile.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/common/Loader'
import { Edit2, Upload } from 'lucide-react'

interface ProfileFormProps {
  initialData: {
    full_name: string | null
    phone: string | null
    parent_phone_number: string | null
    profile_picture_url: string | null
    role: string
    email: string | null
  }
}

/**
 * Editable profile form component
 * 
 * @security Client-side validation + server-side action
 */
export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData.profile_picture_url)
  
  // Track current profile data (updates after saves)
  const [currentData, setCurrentData] = useState(initialData)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: currentData.full_name || '',
      phone: currentData.phone || '',
      parentPhone: currentData.parent_phone_number || '',
    },
  })

  // Update form when entering edit mode or when currentData changes
  useEffect(() => {
    if (isEditing) {
      reset({
        fullName: currentData.full_name || '',
        phone: currentData.phone || '',
        parentPhone: currentData.parent_phone_number || '',
      })
    }
  }, [isEditing, currentData, reset])

  const handleSave = async (data: ProfileUpdateInput) => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const result = await updateProfile(data)

    if (result && !result.success) {
      setError(result.error)
      setIsSaving(false)
    } else {
      setSuccess('Profile updated successfully!')
      setIsSaving(false)
      setIsEditing(false)
      setTimeout(() => setSuccess(null), 3000)
      // Update current data to reflect changes
      setCurrentData(prev => ({
        ...prev,
        full_name: data.fullName || prev.full_name,
        phone: data.phone || prev.phone,
        parent_phone_number: data.parentPhone || prev.parent_phone_number,
      }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      setProfilePicture(file)
      setError(null)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePictureUpload = async () => {
    if (!profilePicture) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('profilePicture', profilePicture)

      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Update preview URL and current data
      setPreviewUrl(result.profilePictureUrl)
      setCurrentData(prev => ({
        ...prev,
        profile_picture_url: result.profilePictureUrl,
      }))
      setProfilePicture(null)
      setSuccess('Profile picture updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
      setIsLoading(false)
    } catch (error) {
      console.error('❌ Upload error:', error)
      setError('Failed to upload profile picture. Please try again.')
      setIsLoading(false)
    }
  }

  // Handle form submission
  const onSubmit = async (data: ProfileUpdateInput) => {
    await handleSave(data)
  }

  // Handle "Done Editing" button click
  const handleDoneEditing = async () => {
    const formData = watch()
    await handleSave(formData)
  }

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800 flex items-center gap-2" role="alert">
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-center gap-2" role="alert">
          <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-200">
        <div className="relative">
          {previewUrl ? (
            <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-gray-200">
              <Image
                src={previewUrl}
                alt={`${currentData.full_name || 'User'}'s profile picture`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg ring-2 ring-gray-200">
              <span className="text-white font-bold text-4xl">
                {(currentData.full_name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {currentData.full_name || 'No name set'}
          </h2>
          <p className="text-sm font-medium text-gray-500 capitalize mb-4">{currentData.role}</p>
          {isEditing && (
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="profilePicture"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium text-gray-700"
              >
                <Upload className="h-4 w-4" />
                {profilePicture ? 'Change Picture' : 'Upload Picture'}
              </label>
              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />
              {profilePicture && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePictureUpload}
                  disabled={isLoading}
                  className="text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader inline className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    'Save Picture'
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
              Full Name
            </Label>
            {isEditing ? (
              <>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  className="h-11"
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                />
                {errors.fullName && (
                  <p id="fullName-error" className="text-sm text-red-600 mt-1" role="alert">
                    {errors.fullName.message}
                  </p>
                )}
              </>
            ) : (
              <div className="h-11 flex items-center px-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm text-gray-900">
                  {currentData.full_name || 'Not set'}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={currentData.email || ''}
              disabled
              className="h-11 bg-gray-50 cursor-not-allowed"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
              Phone Number
            </Label>
            {isEditing ? (
              <>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className="h-11"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="text-sm text-red-600 mt-1" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </>
            ) : (
              <div className="h-11 flex items-center px-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm text-gray-900">
                  {currentData.phone || 'Not set'}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentPhone" className="text-sm font-semibold text-gray-700">
              Parent Phone Number
            </Label>
            {isEditing ? (
              <>
                <Input
                  id="parentPhone"
                  type="tel"
                  {...register('parentPhone')}
                  className="h-11"
                  aria-invalid={!!errors.parentPhone}
                  aria-describedby={errors.parentPhone ? 'parentPhone-error' : undefined}
                />
                {errors.parentPhone && (
                  <p id="parentPhone-error" className="text-sm text-red-600 mt-1" role="alert">
                    {errors.parentPhone.message}
                  </p>
                )}
              </>
            ) : (
              <div className="h-11 flex items-center px-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm text-gray-900">
                  {currentData.parent_phone_number || 'Not set'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false)
                  reset({
                    fullName: currentData.full_name || '',
                    phone: currentData.phone || '',
                    parentPhone: currentData.parent_phone_number || '',
                  })
                  setError(null)
                  setSuccess(null)
                }}
                disabled={isSaving}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDoneEditing}
                disabled={isSaving}
                className="px-6"
              >
                {isSaving ? (
                  <>
                    <Loader inline className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="px-6"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

