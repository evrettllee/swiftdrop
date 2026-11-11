import { useState } from 'react';
import { keepSelection } from '../lib/candidates';
import type { CandidatesAnswer } from './useCandidates';

type Choice = {
  selectedId: number | null;
  isLost: boolean;
  answer: CandidatesAnswer | null;
};

export function useCandidateChoice(answer: CandidatesAnswer | null) {
  const [choice, setChoice] = useState<Choice>({ selectedId: null, isLost: false, answer });

  if (answer !== choice.answer) {
    const data = answer?.data ?? null;
    const isSameQuery = answer !== null && choice.answer?.query === answer.query;
    const kept =
      data === null
        ? { selectedId: choice.selectedId, isLost: false }
        : keepSelection(choice.selectedId, data.suitable);

    setChoice({
      selectedId: kept.selectedId,
      isLost: choice.isLost || (kept.isLost && isSameQuery),
      answer,
    });
  }

  return {
    selectedId: choice.selectedId,
    isLost: choice.isLost,
    select: (selectedId: number) =>
      setChoice((current) => ({ ...current, selectedId, isLost: false })),
  };
}
