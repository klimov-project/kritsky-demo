/**
 * Composable for term question toggles in task1 filters
 * Used in TermQuestionToggles component and buildPayload
 */
export const useTermQuestionToggles = () => {
  const includeWorkQuestions = useState('term-include-work-questions', () => true)
  const includeTermQuestions = useState('term-include-term-questions', () => true)

  return {
    includeWorkQuestions,
    includeTermQuestions,
  }
}
