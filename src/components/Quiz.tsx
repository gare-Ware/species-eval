'use client';

import { useState } from 'react';
import type { Option } from '@/data/questions';
import { questions } from '@/data/questions';
import { getSpecies } from '@/data/species';
import { scoreQuiz } from '@/lib/scoring';
import { StartScreen } from './StartScreen';
import { QuestionCard } from './QuestionCard';
import { ResultCard } from './ResultCard';

type Step = 'start' | 'quiz' | 'result';

// Single client orchestrator: holds the flow state and renders exactly one step at
// a time. Plain React state is enough for ~6 questions (no context/reducer). The
// step swap is the natural seam for Phase 2's AnimatePresence.
export function Quiz() {
  const [step, setStep] = useState<Step>('start');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Option[]>([]);

  function reset(nextStep: Step) {
    setStep(nextStep);
    setIndex(0);
    setAnswers([]);
  }

  function handleAnswer(option: Option) {
    const next = [...answers, option];
    setAnswers(next);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      setStep('result');
    }
  }

  if (step === 'start') {
    return (
      <StartScreen
        questionCount={questions.length}
        onBegin={() => reset('quiz')}
      />
    );
  }

  if (step === 'quiz') {
    return (
      <QuestionCard
        question={questions[index]}
        index={index}
        total={questions.length}
        onAnswer={handleAnswer}
      />
    );
  }

  const { winnerId } = scoreQuiz(answers);
  return (
    <ResultCard species={getSpecies(winnerId)} onRetake={() => reset('start')} />
  );
}
