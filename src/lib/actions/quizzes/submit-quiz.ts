'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { submitQuizAttemptSchema } from '@/lib/validations/quiz.schema'
import { handleServerError } from '@/lib/utils/errors'

/**
 * Submit a quiz attempt, calculate grade, and update attendance
 * 
 * @security Server-side only, protected by RLS, verifies ownership
 */
export async function submitQuiz(input: unknown) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized. Please sign in.',
      }
    }

    // Validate input
    const { attemptId } = submitQuizAttemptSchema.parse(input)

    // Get the attempt and verify ownership
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('id, quiz_id, student_id, submitted_at')
      .eq('id', attemptId)
      .eq('student_id', user.id)
      .single()

    if (attemptError || !attempt) {
      return {
        success: false,
        error: 'Quiz attempt not found or unauthorized.',
      }
    }

    // Can't submit twice
    if (attempt.submitted_at) {
      return {
        success: false,
        error: 'Quiz has already been submitted.',
      }
    }

    // Get quiz to find session_id
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, session_id')
      .eq('id', attempt.quiz_id)
      .single()

    if (quizError || !quiz) {
      return {
        success: false,
        error: 'Quiz not found.',
      }
    }

    // Get all answers for this attempt
    const { data: answers, error: answersError } = await supabase
      .from('quiz_answers')
      .select('question_id, option_id, is_correct')
      .eq('attempt_id', attemptId)

    if (answersError) throw answersError

    // Get all questions for this quiz to calculate total points
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id')
      .eq('quiz_id', attempt.quiz_id)

    if (questionsError) throw questionsError

    const totalQuestions = questions?.length || 0
    const correctAnswers = answers?.filter(a => a.is_correct === true).length || 0

    // Calculate score as percentage
    const score = totalQuestions > 0 
      ? Math.round((correctAnswers / totalQuestions) * 100) 
      : 0

    // Update attempt with score and submission time
    const { error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        score,
        submitted_at: new Date().toISOString(),
      } as never)
      .eq('id', attemptId)

    if (updateError) throw updateError

    // Update attendance with quiz grade from the latest submission
    // Get the latest submitted attempt for this quiz to get the most recent score
    const { data: latestAttempt } = await supabase
      .from('quiz_attempts')
      .select('score, submitted_at')
      .eq('quiz_id', attempt.quiz_id)
      .eq('student_id', user.id)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const latestScore = latestAttempt?.score || score

    // Update attendance with quiz grade if session exists
    if (quiz.session_id) {
      // Get the session to find class_id
      const { data: session } = await supabase
        .from('class_sessions')
        .select('id, class_id')
        .eq('id', quiz.session_id)
        .single()

      if (session) {
        // Update attendance record with quiz grade from latest submission
        // Attendance table uses composite primary key (session_id, student_id)
        // First try to update existing record
        const { data: existingAttendance, error: checkError } = await supabase
          .from('attendance')
          .select('session_id, student_id')
          .eq('session_id', quiz.session_id)
          .eq('student_id', user.id)
          .maybeSingle()

        if (existingAttendance) {
          // Update existing attendance with quiz grade
          const { error: updateError } = await supabase
            .from('attendance')
            .update({ quiz_grade: latestScore } as never)
            .eq('session_id', quiz.session_id)
            .eq('student_id', user.id)

          if (updateError) {
            console.error('Failed to update attendance with quiz grade:', updateError)
          }
        } else {
          // Create new attendance record with quiz grade
          // Note: This assumes the student is present if they're taking the quiz
          const { error: insertError } = await supabase
            .from('attendance')
            .insert({
              session_id: quiz.session_id,
              student_id: user.id,
              status: 'present',
              marked_at: new Date().toISOString(),
              quiz_grade: latestScore,
            } as never)

          if (insertError) {
            console.error('Failed to create attendance with quiz grade:', insertError)
          }
        }
      }
    }

    // Revalidate paths
    revalidatePath(`/student/classes/[classId]/quizzes/[quizId]`, 'page')
    revalidatePath(`/student/classes/[classId]/sessions/[sessionId]`, 'page')
    revalidatePath(`/student/classes/[classId]`, 'page')

    return {
      success: true,
      data: { score, correctAnswers, totalQuestions },
    }
  } catch (error) {
    return handleServerError(error, 'Failed to submit quiz')
  }
}

