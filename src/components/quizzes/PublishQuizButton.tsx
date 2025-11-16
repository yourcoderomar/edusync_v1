'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { togglePublishQuiz } from '@/lib/actions/quizzes/toggle-publish-quiz'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/common/Loader'
import { Eye, EyeOff } from 'lucide-react'

interface PublishQuizButtonProps {
  quizId: string
  isPublished: boolean
  classId?: string
  sessionId?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'ghost'
}

export function PublishQuizButton({ 
  quizId, 
  isPublished, 
  classId,
  sessionId,
  size = 'sm',
  variant = 'outline'
}: PublishQuizButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const result = await togglePublishQuiz(quizId, classId, sessionId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to update quiz status')
      }
    } catch (error) {
      alert('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={isPublished ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}
    >
      {isLoading ? (
        <>
          <Loader className="mr-2 h-4 w-4" />
          {isPublished ? 'Unpublishing...' : 'Publishing...'}
        </>
      ) : (
        <>
          {isPublished ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Unpublish
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Publish
            </>
          )}
        </>
      )}
    </Button>
  )
}

