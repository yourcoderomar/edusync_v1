'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  updateAssignmentSchema,
  type UpdateAssignmentInput,
} from '@/lib/validations/assignment.schema'
import { updateAssignment } from '@/lib/actions/assignments/update-assignment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader } from '@/components/common/Loader'

interface AssignmentEditFormProps {
  assignmentId: string
  classId: string
  sessionId: string
  initialTitle: string
  initialInstructions: string | null
  initialDueAt: string | null
  initialMaxPoints: number | null
}

type FormValues = Omit<UpdateAssignmentInput, 'id'> & {
  id: string
}

export function AssignmentEditForm({
  assignmentId,
  classId,
  sessionId,
  initialTitle,
  initialInstructions,
  initialDueAt,
  initialMaxPoints,
}: AssignmentEditFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateAssignmentSchema) as any,
    defaultValues: {
      id: assignmentId,
      title: initialTitle,
      instructions: initialInstructions ?? '',
      dueAt: initialDueAt
        ? new Date(initialDueAt).toISOString().slice(0, 16)
        : '',
      maxPoints: initialMaxPoints ?? undefined,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const result = await updateAssignment({
        ...values,
        classId,
        sessionId,
      })

      if (!result.success) {
        setError(result.error || 'Failed to update assignment')
        return
      }

      router.refresh()
    } catch (err) {
      console.error('Assignment update error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register('title')}
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="text-sm text-red-600" role="alert">
            {String(errors.title.message)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          rows={4}
          {...register('instructions')}
          disabled={isSubmitting}
        />
        {errors.instructions && (
          <p className="text-sm text-red-600" role="alert">
            {String(errors.instructions.message)}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueAt">Due date/time</Label>
          <Input
            id="dueAt"
            type="datetime-local"
            {...register('dueAt')}
            disabled={isSubmitting}
          />
          {errors.dueAt && (
            <p className="text-sm text-red-600" role="alert">
              {String(errors.dueAt.message)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPoints">Max points</Label>
          <Input
            id="maxPoints"
            type="number"
            step="1"
            min="1"
            {...register('maxPoints', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.maxPoints && (
            <p className="text-sm text-red-600" role="alert">
              {String(errors.maxPoints.message)}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader inline className="mr-2" />
            Saving…
          </>
        ) : (
          'Save changes'
        )}
      </Button>
    </form>
  )
}







