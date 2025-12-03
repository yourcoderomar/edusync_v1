'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import {
  assignmentModeEnum,
  createFreeformAssignmentSchema,
  createStructuredAssignmentSchema,
  createBulkMcqAssignmentSchema,
  type AssignmentMode,
} from '@/lib/validations/assignment.schema'
import { createAssignment } from '@/lib/actions/assignments/create-assignment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader } from '@/components/common/Loader'

type BaseFormValues = {
  mode: AssignmentMode
  sessionId: string
  title: string
  instructions?: string | null
  dueAt?: string | null
  maxPoints?: number | null
}

type BulkRow = {
  correctOption: 'A' | 'B' | 'C' | 'D'
  points: number
}

interface AssignmentModeFormProps {
  sessionId: string
  classId: string
}

/**
 * Assignment creation form with three modes:
 * - Freeform
 * - Structured
 * - Bulk MCQ (A/B/C/D)
 */
export function AssignmentModeForm({ sessionId, classId }: AssignmentModeFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<AssignmentMode>('freeform')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(5)
  const [bulkRows, setBulkRows] = useState<BulkRow[]>(
    Array.from({ length: 5 }, () => ({
      correctOption: 'A',
      points: 1,
    }))
  )

  const { register, handleSubmit, formState: { errors } } = useForm<BaseFormValues>({
    defaultValues: {
      mode: 'freeform',
      sessionId,
      title: '',
    },
  })

  const handleModeChange = (value: AssignmentMode) => {
    setMode(value)
    setError(null)
  }

  const handleBulkQuestionCountChange = (value: string) => {
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed) || parsed <= 0) return
    const clamped = Math.min(parsed, 200)
    setQuestionCount(clamped)
    setBulkRows((prev) => {
      const next = [...prev]
      if (clamped > next.length) {
        for (let i = next.length; i < clamped; i++) {
          next.push({
            correctOption: 'A',
            points: 1,
          })
        }
      } else if (clamped < next.length) {
        next.length = clamped
      }
      return next
    })
  }

  const updateBulkRow = (index: number, field: keyof BulkRow, value: any) => {
    setBulkRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const onSubmit = handleSubmit(async (baseData) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Normalize maxPoints to avoid NaN issues when the field is left empty
      const normalizedMaxPoints =
        typeof baseData.maxPoints === 'number' && !Number.isNaN(baseData.maxPoints)
          ? baseData.maxPoints
          : null

      const common = {
        sessionId,
        title: baseData.title,
        dueAt: baseData.dueAt || null,
        maxPoints: normalizedMaxPoints,
      }

      let payload: any

      if (mode === 'freeform') {
        payload = createFreeformAssignmentSchema.parse({
          ...common,
          mode: 'freeform',
          instructions: baseData.instructions ?? '',
        })
      } else if (mode === 'structured') {
        // For now, structured mode behaves like freeform + no questions editor yet.
        // This keeps the API ready while UI focuses on freeform + bulk MCQ.
        payload = createStructuredAssignmentSchema.parse({
          ...common,
          mode: 'structured',
          instructions: baseData.instructions ?? null,
          questions: [],
        })
      } else {
        // Bulk MCQ
        const rows = bulkRows.slice(0, questionCount)

        payload = createBulkMcqAssignmentSchema.parse({
          ...common,
          mode: 'bulk_mcq',
          instructions: baseData.instructions ?? null,
          questionCount: rows.length,
          rows,
        })
      }

      const result = await createAssignment(payload)

      if (!result.success) {
        setError(result.error || 'Failed to create assignment')
        return
      }

      router.push(
        `/admin/classes/${classId}/sessions/${sessionId}/assignments`
      )
      router.refresh()
    } catch (err: any) {
      // Zod validation errors are handled here too
      const message =
        err?.errors?.[0]?.message ||
        err?.message ||
        'An unexpected error occurred. Please try again.'
      setError(message)
      console.error('Assignment creation error:', err)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && (
        <div
          className="rounded-md bg-red-50 p-4 text-sm text-red-800"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>
            Choose how you want to create this assignment, then fill in the
            details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register('title' as const)}
                placeholder="Enter assignment title"
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {String(errors.title.message)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="mode">Mode</Label>
              <Select
                value={mode}
                onValueChange={(value) => handleModeChange(value as AssignmentMode)}
              >
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freeform">Freeform (homework style)</SelectItem>
                  <SelectItem value="structured">
                    Structured (per-question, advanced)
                  </SelectItem>
                  <SelectItem value="bulk_mcq">
                    Bulk MCQ (A/B/C/D grid)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="dueAt">Due date/time (optional)</Label>
              <Input
                id="dueAt"
                type="datetime-local"
                {...register('dueAt' as const)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="maxPoints">Max points (optional)</Label>
              <Input
                id="maxPoints"
                type="number"
                step="1"
                min="1"
                {...register('maxPoints' as const, { valueAsNumber: true })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              {...register('instructions' as const)}
              placeholder="Paste full assignment instructions or questions here"
              disabled={isSubmitting}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {mode === 'bulk_mcq' && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk MCQ Questions</CardTitle>
            <CardDescription>
              Enter how many questions you want, then fill them out in this grid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="questionCount" className="whitespace-nowrap">
                Number of questions
              </Label>
              <Input
                id="questionCount"
                type="number"
                min={1}
                max={200}
                value={questionCount}
                onChange={(e) => handleBulkQuestionCountChange(e.target.value)}
                disabled={isSubmitting}
                className="w-32"
              />
            </div>

            <div className="space-y-4">
              {bulkRows.slice(0, questionCount).map((row, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4 space-y-3 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Question {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <Label>Correct option</Label>
                      <Select
                        value={row.correctOption}
                        onValueChange={(value) =>
                          updateBulkRow(index, 'correctOption', value as any)
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Points</Label>
                      <Input
                        type="number"
                        min={1}
                        value={row.points}
                        onChange={(e) =>
                          updateBulkRow(
                            index,
                            'points',
                            parseInt(e.target.value || '1', 10)
                          )
                        }
                        className="w-24"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader inline className="mr-2" />
              Creating...
            </>
          ) : (
            'Create assignment'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              `/admin/classes/${classId}/sessions/${sessionId}/assignments`
            )
          }
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}


