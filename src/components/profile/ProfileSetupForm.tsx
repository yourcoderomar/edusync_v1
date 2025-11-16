'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/common/Loader'
import { Upload } from 'lucide-react'

/**
 * Profile setup form component for mandatory profile picture upload
 * 
 * @security Client-side validation + server-side action
 */
export function ProfileSetupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!profilePicture) {
      setError('Please select a profile picture')
      return
    }

    setIsLoading(true)
    setError(null)

    // Create FormData
    const formData = new FormData()
    formData.append('profilePicture', profilePicture)

    console.log('📤 Submitting profile picture upload...')

    try {
      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      console.log('📬 Upload result:', result)

      if (!result.success) {
        console.error('❌ Upload failed:', result.error)
        setError(result.error)
        setIsLoading(false)
      } else {
        // Redirect to dashboard
        window.location.href = result.redirectPath
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
      setError('Failed to upload profile picture. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
      {error && (
        <div
          className="rounded-md bg-red-50 p-4 text-sm text-red-800"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="profilePicture" className="text-base font-medium text-gray-900">
            Profile Picture <span className="text-red-600" aria-label="required">*</span>
          </Label>
          <p className="mt-1 text-sm text-gray-500">
            Upload a profile picture to complete your account setup
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {previewUrl && (
            <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-gray-300 shadow-lg">
              <img
                src={previewUrl}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          
          <div className="w-full">
            <label
              htmlFor="profilePicture"
              className="flex flex-col items-center justify-center gap-2 w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {profilePicture ? 'Change image' : 'Click to upload'}
              </span>
              <span className="text-xs text-gray-500">
                JPG, PNG or GIF. Max 5MB
              </span>
            </label>
            <input
              id="profilePicture"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="sr-only"
              required
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? 'profilePicture-error' : undefined}
            />
          </div>
        </div>
      </div>

      <div>
        <Button
          type="submit"
          disabled={isLoading || !profilePicture}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader inline className="mr-2" />
              Uploading...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </form>
  )
}

