'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Loader2, Send } from 'lucide-react'
import { startQuizAttempt } from '@/lib/actions/quizzes/start-quiz-attempt'
import { saveQuizAnswer } from '@/lib/actions/quizzes/save-quiz-answer'
import { submitQuiz } from '@/lib/actions/quizzes/submit-quiz'
import { useRouter } from 'next/navigation'

interface TakeQuizFormProps {
  quizId: string
  questions: Array<{
    id: string
    question_text: string
    question_type: string
    options?: Array<{
      id: string
      option_text: string
      is_correct: boolean
      order_index: number
    }>
  }>
  attemptId?: string | null
  isSubmitted?: boolean
  initialAnswers?: Record<string, string | null>
}

export function TakeQuizForm({ quizId, questions, attemptId: initialAttemptId, isSubmitted: initialIsSubmitted, initialAnswers }: TakeQuizFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId || null)
  const [isSubmitted, setIsSubmitted] = useState(initialIsSubmitted || false)
  const [answers, setAnswers] = useState<Map<string, string | null>>(() => {
    const map = new Map<string, string | null>()
    if (initialAnswers) {
      Object.entries(initialAnswers).forEach(([key, value]) => {
        map.set(key, value)
      })
    }
    return map
  })
  const [score, setScore] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load existing answers when attempt exists
  useEffect(() => {
    if (initialAnswers) {
      const newMap = new Map<string, string | null>()
      Object.entries(initialAnswers).forEach(([key, value]) => {
        newMap.set(key, value)
      })
      setAnswers(newMap)
    }
  }, [initialAnswers])

  // Start quiz attempt if not already started
  const handleStartQuiz = async () => {
    if (attemptId) return

    startTransition(async () => {
      const result = await startQuizAttempt({ quizId })
      if (result.success && result.data) {
        setAttemptId(result.data.attemptId)
        toast.success('Quiz started!')
      } else {
        toast.error(result.error || 'Failed to start quiz')
      }
    })
  }

  // Save answer for a question
  const handleAnswerChange = async (questionId: string, optionId: string | null) => {
    if (!attemptId || isSubmitted || !optionId) return

    // Optimistically update UI
    setAnswers(prev => {
      const newAnswers = new Map(prev)
      newAnswers.set(questionId, optionId)
      return newAnswers
    })

    // Save answer to database
    startTransition(async () => {
      const result = await saveQuizAnswer({
        attemptId,
        questionId,
        selectedOptionId: optionId,
        answerText: null,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to save answer')
        // Revert the answer change on error
        setAnswers(prev => {
          const newAnswers = new Map(prev)
          newAnswers.delete(questionId)
          return newAnswers
        })
      }
    })
  }

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (!attemptId || isSubmitted) return

    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => !answers.has(q.id))
    if (unansweredQuestions.length > 0) {
      const confirm = window.confirm(
        `You have ${unansweredQuestions.length} unanswered question(s). Are you sure you want to submit?`
      )
      if (!confirm) return
    }

    setIsSubmitting(true)
    startTransition(async () => {
      const result = await submitQuiz({ attemptId })
      if (result.success && result.data) {
        setIsSubmitted(true)
        setScore(result.data.score)
        toast.success(`Quiz submitted! Your score: ${result.data.score}%`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to submit quiz')
        setIsSubmitting(false)
      }
    })
  }

  // If quiz not started, show start button
  if (!attemptId && !initialAttemptId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-gray-700">
              Ready to start the quiz? Click the button below to begin.
            </p>
            <Button 
              onClick={handleStartQuiz} 
              disabled={isPending}
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Quiz'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate score if submitted
  const correctAnswers = isSubmitted && questions.length > 0
    ? questions.filter(q => {
        const answerId = answers.get(q.id)
        if (!answerId) return false
        const option = q.options?.find(opt => opt.id === answerId)
        return option?.is_correct === true
      }).length
    : 0

  const totalQuestions = questions.length

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Questions</CardTitle>
          <CardDescription>
            {isSubmitted 
              ? `You scored ${score}% (${correctAnswers} out of ${totalQuestions} correct)`
              : 'Answer all questions and click Submit when done'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Questions */}
      {questions.map((question, index) => {
        const selectedAnswerId = answers.get(question.id)
        const selectedOption = question.options?.find(opt => opt.id === selectedAnswerId)
        const isCorrect = selectedOption?.is_correct === true

        return (
          <Card key={question.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">
                    Question {index + 1}
                  </h3>
                  {isSubmitted && selectedAnswerId && (
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-green-700 font-medium text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-700 font-medium text-sm">
                          <XCircle className="h-4 w-4" />
                          Incorrect
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-gray-900">{question.question_text}</p>

                {question.options && question.options.length > 0 && (
                  <div className="space-y-2">
                    {question.options
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((option) => {
                        const isSelected = selectedAnswerId === option.id
                        const showCorrect = isSubmitted && option.is_correct

                        return (
                          <div
                            key={option.id}
                            className={`flex items-start gap-2 p-3 rounded border cursor-pointer transition-colors ${
                              isSelected && isSubmitted
                                ? isCorrect
                                  ? 'bg-green-100 border-green-300'
                                  : 'bg-red-100 border-red-300'
                                : isSelected
                                ? 'bg-blue-50 border-blue-300'
                                : showCorrect
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            } ${!isSubmitted ? 'hover:bg-gray-100' : ''}`}
                            onClick={() => !isSubmitted && handleAnswerChange(question.id, option.id)}
                          >
                            {isSelected ? (
                              <div className="h-5 w-5 rounded-full bg-blue-600 border-2 border-blue-600 mt-0.5 flex-shrink-0 flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-white" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <span className={`
                                ${isSelected ? 'font-semibold' : ''}
                                ${isCorrect && showCorrect ? 'text-green-800' : ''}
                                ${isSelected && isSubmitted && !isCorrect ? 'text-red-800' : ''}
                              `}>
                                {option.option_text}
                              </span>
                              {isSelected && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (Your answer)
                                </span>
                              )}
                              {showCorrect && !isSelected && (
                                <span className="ml-2 text-xs text-green-600">
                                  (Correct answer)
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}

                {!isSubmitted && !selectedAnswerId && (
                  <p className="text-sm text-gray-400 italic">
                    Not answered yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Submit Button */}
      {!isSubmitted && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {answers.size} of {totalQuestions} questions answered
              </p>
              <Button 
                onClick={handleSubmitQuiz} 
                disabled={isSubmitting || isPending}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Quiz
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

