import type { Transition } from 'motion/react';
import { slow } from './slowmo';

// The shared "glide" — the single spring the blob rides when it changes position
// (its `layout` animation) and that the start-chrome (headline peel, hint) rides
// on enter/exit. One curve, one source of truth, so they travel *together*
// instead of desyncing (the headline used to peel slower than the blob moved).
// Pre-scaled through slow() once at import; SLOWMO is constant at runtime.
export const GLIDE: Transition = slow({ type: 'spring', stiffness: 320, damping: 26 });
