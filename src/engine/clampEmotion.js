import { EMOTION_CONFIG } from "../config/emotionConfig";

const BASE_EMOTIONS = ["happy", "sad", "angry", "silent"];

export function clampEmotion(current, next, confidence) {

  if (confidence < EMOTION_CONFIG.MIN_CONFIDENCE_TO_CHANGE) {
    return current;
  }

  if (current === next) return current;

  const currentIsBase = BASE_EMOTIONS.includes(current);
  const nextIsBase = BASE_EMOTIONS.includes(next);

  /* =========================================
     1️⃣ Composite → Base protection
     Do not collapse composite too easily
  ========================================= */
  if (!currentIsBase && nextIsBase) {
    // Require stronger confidence to exit composite
    if (confidence < 0.85) {
      return current;
    }
  }

  /* =========================================
     2️⃣ Base → Composite is allowed freely
  ========================================= */
  if (currentIsBase && !nextIsBase) {
    return next;
  }

  /* =========================================
     3️⃣ Base emotion smoothing
  ========================================= */
  if (current === "happy" && next === "angry")
    return "sad";

  if (current === "silent" && next === "angry")
    return "sad";

  return next;
}
