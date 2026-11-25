"use client";
// =============================================================================
// useWordData.ts — a React hook that gives components the word lists plus
// "is it still loading?" / "did it fail?" flags.
//
// WHY a hook: components shouldn't care HOW data is loaded. They just call
// `const { data, loading, error } = useWordData()` and render accordingly.
// =============================================================================

import { useEffect, useState } from "react";
import { loadWordData } from "@/lib/browser/loadWordData";
import type { WordData } from "@/lib/game/types";

export interface UseWordDataResult {
  data: WordData | null;
  loading: boolean;
  error: string | null;
}

export function useWordData(): UseWordDataResult {
  const [data, setData] = useState<WordData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // useEffect runs AFTER the component appears on screen. That's where
  // side effects like network requests belong, never during rendering.
  useEffect(() => {
    // If the component disappears before loading finishes, `cancelled`
    // stops us from updating state on something that's no longer on screen.
    let cancelled = false;

    loadWordData()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });

    // This "cleanup" function runs when the component goes away.
    return () => {
      cancelled = true;
    };
  }, []); // [] = run only once, when the component first appears

  // "loading" isn't stored separately: we're loading if we have neither
  // data nor an error yet. Fewer pieces of state = fewer ways to get out of sync.
  return { data, loading: data === null && error === null, error };
}
