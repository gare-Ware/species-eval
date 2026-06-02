interface StartScreenProps {
  questionCount: number;
  onBegin: () => void;
}

// One of three mountable steps in the quiz flow. Kept as a self-contained unit so
// Phase 2 can wrap the step swap in AnimatePresence without restructuring.
export function StartScreen({ questionCount, onBegin }: StartScreenProps) {
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
        A personality quiz
      </p>
      <h1 className="text-4xl font-semibold sm:text-5xl">
        What Alien Species Are You?
      </h1>
      <p className="max-w-md text-balance text-white/60">
        {questionCount} quick questions, one deeply unscientific verdict on which
        visitor from the lore you most resemble.
      </p>
      <button
        type="button"
        onClick={onBegin}
        className="mt-2 rounded-full bg-white px-8 py-3 font-medium text-black transition hover:bg-white/85"
      >
        Begin
      </button>
    </section>
  );
}
