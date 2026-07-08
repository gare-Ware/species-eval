'use client';

// useNarrative
// Owns the single narrative fetch and its lifecycle so Quiz can block the
// result reveal on it. An attempt counter (not just the AbortController) is the
// source of truth for "is this response still wanted", so a retake/retry that
// aborts an in-flight request can never land a stale result on the screen. A
// request timeout aborts a hang and surfaces it as an ordinary error (the reveal
// blocks on the AI, but must never block forever).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Option } from '@/data/questions';
import { fetchNarrative } from '@/lib/narrative/client';

export type NarrativeStatus = 'idle' | 'loading' | 'ready' | 'error';

const REQUEST_TIMEOUT_MS = 30_000;

export interface UseNarrative {
  status: NarrativeStatus;
  narrative: string | null;
  /** Begin (or restart) a request for the given answers. */
  start: (answers: Option[]) => void;
  /** Abort any in-flight request and return to idle (used on retake). */
  reset: () => void;
}

export function useNarrative(): UseNarrative {
  const [status, setStatus] = useState<NarrativeStatus>('idle');
  const [narrative, setNarrative] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const attemptRef = useRef(0);

  const reset = useCallback(() => {
    // Invalidate any in-flight attempt so its resolution is ignored.
    attemptRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus('idle');
    setNarrative(null);
  }, []);

  const start = useCallback((answers: Option[]) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const attempt = (attemptRef.current += 1);

    setStatus('loading');
    setNarrative(null);

    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    fetchNarrative(answers, controller.signal)
      .then((text) => {
        if (attempt !== attemptRef.current) return; // superseded by a newer attempt
        setNarrative(text);
        setStatus('ready');
      })
      .catch(() => {
        // A newer attempt (retry/retake) already owns the state — stay quiet.
        // Otherwise every failure, including a timeout-triggered abort, is an
        // error the reveal should surface.
        if (attempt !== attemptRef.current) return;
        setStatus('error');
      })
      .finally(() => clearTimeout(timeout));
  }, []);

  // Abort a request still in flight if the component unmounts.
  useEffect(() => () => controllerRef.current?.abort(), []);

  return { status, narrative, start, reset };
}
