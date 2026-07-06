import { Quiz } from '@/components/Quiz';

export default function Home() {
  return (
    // overflow-clip contains the transient overflow from enter/exit offsets (no
    // scrollbar flash) while main can still grow for genuinely tall content.
    // relative: main is the containing block for elements popLayout pins as
    // position:absolute during their exit.
    <main className="relative flex min-h-dvh items-center justify-center overflow-clip p-6">
      <div className="w-full max-w-xl">
        <Quiz />
      </div>
    </main>
  );
}
