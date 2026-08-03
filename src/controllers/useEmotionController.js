// src/controllers/useEmotionController.js
/**
 * Owns the emotion field/dominant-emotion state and exposes
 * `submitText` for the UI to call. Behavior is unchanged from before
 * the refactor — this file only had its ~7 prior commented-out
 * iterations removed (see audit §3.2; history now lives in git, not
 * in this file).
 */
import { useEffect, useRef, useState } from "react";
import { interpretEmotion } from "../ai/emotionAI";
import {
  updateEmotionField,
  getDominantEmotion,
} from "../engine/emotionField";
import { clampEmotion } from "../engine/clampEmotion";
import { EMOTION_CONFIG } from "../config/emotionConfig";
import { useEmotionHistory } from "../hooks/useEmotionHistory";

// Phase 2 fix (§5 rendering / §2 React performance): `messages` used to
// grow without bound for the lifetime of the tab. In the public build
// only the last few are ever visible (MessageList fades everything past
// its `maxVisible` window to opacity 0, permanently), so a long-running
// conversation was accumulating message objects — and, in the public
// build, DOM nodes for all of them — indefinitely for no visible
// benefit. Bounded well above any current display window so behavior
// is unaffected; just stops unbounded growth in hours-long sessions.
const MAX_RETAINED_MESSAGES = 100;

export function useEmotionController() {
  const [emotion, setEmotion] = useState("silent");
  const [messages, setMessages] = useState([]);
  const [emotionField, setEmotionField] = useState({
    happy: 0,
    sad: 0,
    angry: 0,
    bittersweet: 0,
    disgust: 0,
    sarcastic: 0,
    conflicted: 0,
    overwhelmed: 0,
  });

  const lastUpdateRef = useRef(Date.now());
  const emotionLockRef = useRef(0);

  /* Passive time tick — drives decay only, no emotional injection. */
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      const passiveAI = { happy: 0, sad: 0, angry: 0, confidence: 1 };

      setEmotionField((prev) => updateEmotionField(prev, passiveAI, deltaMs));
    }, EMOTION_CONFIG.DECAY_INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  /* Field → emotion sync. */
  useEffect(() => {
    const now = Date.now();
    if (now < emotionLockRef.current) return;

    const suggested = getDominantEmotion(emotionField, emotion);

    if (suggested !== emotion) {
      const validated = clampEmotion(emotion, suggested, 1.0);

      if (validated !== emotion) {
        setEmotion(validated);
        emotionLockRef.current = now + EMOTION_CONFIG.EMOTION_LOCK_DURATION;
      }
    }
  }, [emotionField]);

  /* Submit text: perceive → update field. */
  async function submitText(text) {
    if (!text.trim()) return;

    const now = Date.now();
    const deltaMs = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    const ai = await interpretEmotion(text);

    setMessages((prev) => {
      const next = [...prev, { text }];
      return next.length > MAX_RETAINED_MESSAGES
        ? next.slice(next.length - MAX_RETAINED_MESSAGES)
        : next;
    });
    setEmotionField((prev) => updateEmotionField(prev, ai, deltaMs));
  }

  const history = useEmotionHistory(
    emotionField,
    EMOTION_CONFIG.TIMELINE_INTERVAL,
    EMOTION_CONFIG.TIMELINE_MAX_POINTS
  );

  return {
    emotion,
    messages,
    emotionField,
    submitText,
    timeline: history,
  };
}
