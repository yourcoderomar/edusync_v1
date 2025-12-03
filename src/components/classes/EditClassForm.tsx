'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { updateClassSchema, type UpdateClassInput } from '@/lib/validations/class.schema'
import { updateClass } from '@/lib/actions/classes/update-class'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader } from '@/components/common/Loader'

interface EditClassFormProps {
  classId: string
  initialData: {
    name: string
    description: string | null
  }
}

/**
 * Class edit form
 * 
 * @semantic Uses semantic HTML form elements
 * @security Client-side validation + server action
 */
export function EditClassForm({ classId, initialData }: EditClassFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateClassInput>({
    resolver: zodResolver(updateClassSchema),
    defaultValues: {
      id: classId,
      name: initialData.name,
      description: initialData.description,
    },
  })

  const onSubmit = async (data: UpdateClassInput) => {
    setIsLoading(true)
    setError(null)

    const result = await updateClass(data)

    if (!result.success) {
      setError(result.error || 'An error occurred')
      setIsLoading(false)
      return
    }

    router.push(`/admin/classes/${classId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {error && (
        <div
          className="rounded-md bg-red-50 p-4 text-sm text-red-800"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <input type="hidden" value={classId} {...register('id')} />

      <div className="space-y-2">
        <Label htmlFor="name">
          Class name <span className="text-red-600" aria-label="required">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="e.g., Mathematics 101"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-red-600" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-gray-500 text-xs font-normal">(optional)</span>
        </Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Enter a description for this class..."
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          {...register('description')}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isLoading}
          aria-label={isLoading ? 'Updating class...' : 'Update class'}
        >
          {isLoading ? (
            <>
              <Loader size="sm" className="mr-2" inline />
              Updating...
            </>
          ) : (
            'Update class'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}



