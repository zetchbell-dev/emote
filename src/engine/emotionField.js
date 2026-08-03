// src/engine/emotionField.js
/**
 * Emotion field state machine.
 *
 * - updateEmotionField(): applies time-based decay to the base
 *   emotions, injects the AI's new per-emotion forces, then derives
 *   composite emotions from the result.
 * - getDominantEmotion(): re-exported from ./dominance so existing
 *   `import { updateEmotionField, getDominantEmotion } from
 *   "./emotionField"` call sites don't need to change.
 *
 * Split out of one large file into emotionField.js (state transition),
 * composite.js (composite math), and dominance.js (selection) — see
 * audit §3.2. Each piece now has one job and can be read/tuned on
 * its own instead of scrolling through hundreds of lines of prior
 * commented-out iterations to find the version that's actually live.
 */
import { EMOTION_CONFIG } from "../config/emotionConfig";
import { computeComposites, clamp01 } from "./composite";

export { getDominantEmotion } from "./dominance";

const BASE_KEYS = ["happy", "sad", "angry"];

export function updateEmotionField(prev, ai, deltaMs = 1000) {
  const next = { ...prev };

  // 1) Time-based decay, base emotions only.
  const decayFactor = Math.pow(
    EMOTION_CONFIG.TIME_DECAY_FACTOR,
    deltaMs / EMOTION_CONFIG.DECAY_INTERVAL_MS
  );
  BASE_KEYS.forEach((k) => {
    next[k] = clamp01((next[k] ?? 0) * decayFactor);
  });

  // 2) Inject the AI's per-emotion forces for this message.
  BASE_KEYS.forEach((k) => {
    const gain = (ai?.[k] ?? 0) * (EMOTION_CONFIG.GAIN_MULTIPLIER?.[k] ?? 1);
    next[k] = clamp01(next[k] + gain);
  });

  // 3) Derive composites from the updated base emotions.
  Object.assign(
    next,
    computeComposites({ happy: next.happy, sad: next.sad, angry: next.angry })
  );

  return next;
}
