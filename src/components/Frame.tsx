// Poster border around the whole viewport, colored by --accent so it matches
// the headline/blob at rest and rides the species theme takeover on reveal
// (which is why it renders inside Quiz's themed subtree, not the layout).
// All geometry + the color cross-fade live in .frame in globals.css; kill it
// by setting --frame-width to 0px there or removing this from Quiz.
export function Frame() {
  return <div aria-hidden className="frame pointer-events-none fixed z-50" />;
}
