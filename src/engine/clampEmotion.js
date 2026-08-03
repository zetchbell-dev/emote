// src/engine/clampEmotion.js
/**
 * Final gate between "what does the field suggest" and "what do we
 * actually show." Two protections:
 *  - Composite → base transitions require higher confidence, so a
 *    brief confidence dip doesn't collapse a composite expression
 *    back to a plain base one.
 *  - A couple of hand-tuned base-to-base smoothing rules (e.g. don't
 *    jump straight from happy to angry; route through sad instead)
 *    so transitions read as gradual rather than jarring.
 *
 * NOTE: an earlier audit pass flagged `"silent"` in BASE_EMOTIONS as
 * possibly unreachable since it's not a key in the emotion *field*.
 * That's true of the field, but `"silent"` is a valid emotion
 * *label* — dominance.js returns it whenever total base energy is
 * low — so this logic is live and correct as written. No change
 * needed here beyond removing prior dead iterations.
 */
import { EMOTION_CONFIG } from "../config/emotionConfig";

const BASE_EMOTIONS = ["happy", "sad", "angry", "silent"];

export function clampEmotion(current, next, confidence) {
  if (confidence < EMOTION_CONFIG.MIN_CONFIDENCE_TO_CHANGE) {
    return current;
  }

  if (current === next) return current;

  const currentIsBase = BASE_EMOTIONS.includes(current);
  const nextIsBase = BASE_EMOTIONS.includes(next);

  // Composite → base: require stronger confidence to exit a composite.
  if (!currentIsBase && nextIsBase) {
    if (confidence < 0.85) {
      return current;
    }
  }

  // Base → composite is allowed freely.
  if (currentIsBase && !nextIsBase) {
    return next;
  }

  // Base emotion smoothing — avoid jarring direct jumps.
  // Phase 4: removed the "silent" branch of this rule (audit/Phase3 §2.2).
  // "silent" is the app's rest state, not an established emotion to jar
  // away from, so routing a session's first hostile message through "sad"
  // had no smoothing rationale -- it just silently misreported it. The
  // happy->angry case is left unchanged; it IS a defensible anti-jar rule
  // between two genuinely-established emotions.
  if (current === "happy" && next === "angry") return "sad";

  return next;
}
