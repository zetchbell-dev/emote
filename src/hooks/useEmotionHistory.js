// src/hooks/useEmotionHistory.js
import { useEffect, useRef, useState } from "react";

/**
 * Collects emotion field history over time.
 * Keeps a rolling window of snapshots.
 *
 * Phase 2 fix (§2 React performance / §5 rendering):
 * The sampling `setInterval` used to live inside an effect that
 * depended on `field`. `field` is a brand-new object reference every
 * time the emotion field updates (every decay tick, ~every 2s, plus
 * every submitted message) — so the effect was tearing down and
 * recreating the interval on nearly every field update instead of
 * running on a steady cadence. Since the field can update MORE often
 * than `interval` (e.g. a user sending several messages within a
 * second), the timer could be cleared before it ever fired, silently
 * dropping timeline samples and making the sampling cadence uneven
 * instead of the steady rate `interval` promises.
 *
 * Fixed by keeping the interval's dependency array to just
 * `[interval, maxPoints]` (things that should actually restart the
 * clock) and reading the latest `field` via a ref that's kept current
 * on every render, so the interval itself never needs to churn.
 */
export function useEmotionHistory(field, interval = 500, maxPoints = 120) {
  const [history, setHistory] = useState([]);
  const startTimeRef = useRef(Date.now());
  const fieldRef = useRef(field);

  // Always points at the latest field, without the interval below
  // needing to know it changed.
  useEffect(() => {
    fieldRef.current = field;
  }, [field]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const timestamp = now - startTimeRef.current;

      setHistory((prev) => {
        const next = [
          ...prev,
          {
            time: timestamp,
            ...fieldRef.current,
          },
        ];

        // Keep last maxPoints only
        if (next.length > maxPoints) {
          next.shift();
        }

        return next;
      });
    }, interval);

    return () => clearInterval(id);
  }, [interval, maxPoints]);

  return history;
}
