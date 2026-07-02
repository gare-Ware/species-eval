import { Quiz } from '@/components/Quiz';

export default function Home() {
  return (
    // overflow-clip contains the small transient overflow from the enter/exit
    // offsets (cards/header/hint start a few px past their resting spot), which
    // could otherwise flash a hairline scrollbar mid-transition. main still grows
    // past the viewport for genuinely tall content (a long question on a small
    // display), so the body can still scroll when it actually needs to.
    //
    // relative makes main the containing block for the header/hint that
    // AnimatePresence mode="popLayout" pins as position:absolute while they exit,
    // so they stay put and fade cleanly instead of jumping.
    <main className="relative flex min-h-dvh items-center justify-center overflow-clip p-6">
      <div className="w-full max-w-xl">
        <Quiz />
      </div>
    </main>
  );
}
