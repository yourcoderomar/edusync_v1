'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createQuizSchema, type CreateQuizInput } from '@/lib/validations/quiz.schema'
import { createQuiz } from '@/lib/actions/quizzes/create-quiz'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader } from '@/components/common/Loader'
import { Plus, Trash2, X } from 'lucide-react'

interface QuizFormProps {
  sessionId: string
  classId: string
}

type Question = {
  questionText: string
  questionType: 'multiple_choice' | 'true_false' | 'short_answer'
  points: number
  orderNumber: number
  options?: Array<{
    optionText: string
    isCorrect: boolean
    orderNumber: number
  }>
}

/**
 * Quiz creation form
 * 
 * @accessibility Proper form labels, ARIA attributes
 * @validation Client-side validation with Zod
 */
export function QuizForm({ sessionId, classId }: QuizFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: '',
      questionType: 'multiple_choice',
      points: 1,
      orderNumber: 0,
      options: [
        { optionText: '', isCorrect: false, orderNumber: 0 },
        { optionText: '', isCorrect: false, orderNumber: 1 },
      ],
    },
  ])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<Omit<CreateQuizInput, 'questions'>>({
    resolver: zodResolver(createQuizSchema.omit({ questions: true })),
    defaultValues: {
      sessionId,
    },
  })

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        questionType: 'multiple_choice',
        points: 1,
        orderNumber: questions.length,
        options: [
          { optionText: '', isCorrect: false, orderNumber: 0 },
          { optionText: '', isCorrect: false, orderNumber: 1 },
        ],
      },
    ])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const addOption = (questionIndex: number) => {
    const updated = [...questions]
    const question = updated[questionIndex]
    if (!question.options) question.options = []
    question.options.push({
      optionText: '',
      isCorrect: false,
      orderNumber: question.options.length,
    })
    setQuestions(updated)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions]
    const question = updated[questionIndex]
    if (question.options) {
      question.options = question.options.filter((_, i) => i !== optionIndex)
    }
    setQuestions(updated)
  }

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: 'optionText' | 'isCorrect',
    value: any
  ) => {
    const updated = [...questions]
    const question = updated[questionIndex]
    if (question.options && question.options[optionIndex]) {
      question.options[optionIndex] = {
        ...question.options[optionIndex],
        [field]: value,
      }
    }
    setQuestions(updated)
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Validate questions
      if (questions.length === 0) {
        setError('At least one question is required')
        return
      }

      for (const question of questions) {
        if (!question.questionText.trim()) {
          setError('All questions must have text')
          return
        }

        if (question.options && question.options.length >= 2) {
          if (!question.options.some((opt) => opt.isCorrect)) {
            setError('Each question with options must have at least one correct answer')
            return
          }
        }
      }

      const result = await createQuiz({
        ...data,
        questions,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create quiz')
        return
      }

      router.push(`/admin/classes/${classId}/sessions/${sessionId}/quizzes`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Quiz creation error:', err)
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
          <CardTitle>Quiz Details</CardTitle>
          <CardDescription>Basic information about the quiz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">
              Quiz Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter quiz title"
              disabled={isSubmitting}
              aria-invalid={errors.title ? 'true' : 'false'}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter quiz description"
              disabled={isSubmitting}
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Questions</h2>
          <Button type="button" onClick={addQuestion} disabled={isSubmitting} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add question
          </Button>
        </div>

        {questions.map((question, qIndex) => (
          <Card key={qIndex}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(qIndex)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Question Text</Label>
                <Textarea
                  value={question.questionText}
                  onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                  placeholder="Enter question text"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Answer Options</Label>
                  <Button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    disabled={isSubmitting}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add option
                  </Button>
                </div>

                {question.options?.map((option, oIndex) => (
                  <div key={oIndex} className="flex gap-2 items-start">
                    <Input
                      value={option.optionText}
                      onChange={(e) =>
                        updateOption(qIndex, oIndex, 'optionText', e.target.value)
                      }
                      placeholder={`Option ${oIndex + 1}`}
                      disabled={isSubmitting}
                      className="flex-1"
                    />
                    <label className="flex items-center gap-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={(e) =>
                          updateOption(qIndex, oIndex, 'isCorrect', e.target.checked)
                        }
                        disabled={isSubmitting}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Correct</span>
                    </label>
                    {question.options &&
                      question.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(qIndex, oIndex)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader inline className="mr-2" />
              Creating...
            </>
          ) : (
            'Create quiz'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/classes/${classId}/sessions/${sessionId}/quizzes`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

