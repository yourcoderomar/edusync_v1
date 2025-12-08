import { gradeBulkMcq, type McqQuestionForGrading } from './grading'

const sampleQuestions: McqQuestionForGrading[] = [
  {
    id: 'q1',
    points: 2,
    options: [
      { id: 'q1-a', is_correct: false },
      { id: 'q1-b', is_correct: true },
    ],
  },
  {
    id: 'q2',
    points: 3,
    options: [
      { id: 'q2-a', is_correct: true },
      { id: 'q2-b', is_correct: false },
    ],
  },
]

// Lightweight sanity checks for the grading helper.
// Run with: node --test src/lib/assignments/grading.test.ts
;(function runBasicChecks() {
  const allCorrect = gradeBulkMcq(sampleQuestions, [
    { questionId: 'q1', selectedOptionId: 'q1-b' },
    { questionId: 'q2', selectedOptionId: 'q2-a' },
  ])

  if (allCorrect.totalEarned !== 5 || allCorrect.totalPossible !== 5) {
    throw new Error('Expected full score for all-correct answers')
  }

  const allWrong = gradeBulkMcq(sampleQuestions, [
    { questionId: 'q1', selectedOptionId: 'q1-a' },
    { questionId: 'q2', selectedOptionId: 'q2-b' },
  ])

  if (allWrong.totalEarned !== 0 || allWrong.totalPossible !== 5) {
    throw new Error('Expected zero score for all-wrong answers')
  }

  const partial = gradeBulkMcq(sampleQuestions, [
    { questionId: 'q1', selectedOptionId: 'q1-b' },
    { questionId: 'q2', selectedOptionId: 'q2-b' },
  ])

  if (partial.totalEarned !== 2 || partial.totalPossible !== 5) {
    throw new Error('Expected partial score for mixed answers')
  }
})()







