// src/hooks/useEmotionHistory.js
import { useEffect, useRef, useState } from "react";

/**
 * Collects emotion field history over time.
 * Keeps a rolling window of snapshots.
 */

export function useEmotionHistory(field, interval = 500, maxPoints = 120) {
  const [history, setHistory] = useState([]);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const timestamp = now - startTimeRef.current;

      setHistory((prev) => {
        const next = [
          ...prev,
          {
            time: timestamp,
            ...field,
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
  }, [field, interval, maxPoints]);

  return history;
}
