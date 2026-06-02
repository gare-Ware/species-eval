import type { Option, Question } from '@/data/questions';

interface QuestionCardProps {
  question: Question;
  index: number; // 0-based
  total: number;
  onAnswer: (option: Option) => void;
}

// Renders a single question. Selecting an option advances the flow (handled by the
// orchestrator). A mountable unit so Phase 2 can animate enter/exit per question.
export function QuestionCard({ question, index, total, onAnswer }: QuestionCardProps) {
  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
        <span>
          Question {index + 1} of {total}
        </span>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white/60 transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-2xl font-medium sm:text-3xl">{question.prompt}</h2>

      <ul className="flex flex-col gap-3">
        {question.options.map((option) => (
          <li key={option.label}>
            <button
              type="button"
              onClick={() => onAnswer(option)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition hover:border-white/30 hover:bg-white/[0.07]"
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
