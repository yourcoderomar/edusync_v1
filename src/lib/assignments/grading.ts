export type McqQuestionForGrading = {
  id: string
  points: number | null
  options?: Array<{ id: string; is_correct: boolean | null }>
}

export type McqAnswerPayload = Array<{
  questionId: string
  selectedOptionId: string | null
}>

export function gradeBulkMcq(
  questions: McqQuestionForGrading[],
  answers: McqAnswerPayload
): { totalEarned: number; totalPossible: number } {
  if (!questions.length) {
    return { totalEarned: 0, totalPossible: 0 }
  }

  const answerMap = new Map<string, string | null>()
  for (const answer of answers) {
    answerMap.set(answer.questionId, answer.selectedOptionId)
  }

  let totalPossible = 0
  let totalEarned = 0

  for (const question of questions) {
    const points = typeof question.points === 'number' ? question.points : 0
    totalPossible += points

    const selectedOptionId = answerMap.get(question.id)
    if (!selectedOptionId || !question.options || question.options.length === 0) {
      continue
    }

    const selected = question.options.find((opt) => opt.id === selectedOptionId)
    if (selected && selected.is_correct) {
      totalEarned += points
    }
  }

  return { totalEarned, totalPossible }
}





