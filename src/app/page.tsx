import { Quiz } from '@/components/Quiz';

export default function Home() {
  return (
    // overflow-clip contains the transient overflow from the on/off-screen slide
    // transitions (cards/header/hint translate past their resting spots toward
    // off-screen), which would otherwise grow the page and flash a scrollbar
    // mid-transition. main still grows past the viewport for genuinely tall
    // content (a long question on a small display), so the body can scroll when
    // it actually needs to.
    //
    // relative makes main the containing block for the header/hint that
    // AnimatePresence mode="popLayout" pins as position:absolute while they exit.
    // main never moves, so the pinned elements stay put and glide cleanly off;
    // anchoring them to the re-centering column instead made them jump first. And
    // being inside main, they're still caught by its overflow-clip.
    <main className="relative flex min-h-dvh items-center justify-center overflow-clip p-6">
      <div className="w-full max-w-xl">
        <Quiz />
      </div>
    </main>
  );
}
