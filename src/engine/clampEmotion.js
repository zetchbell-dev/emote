// src/engine/clampEmotion.js
/**
 * Final gate between "what does the field suggest" and "what do we
 * actually show." Two protections:
 *  - Composite → base: require higher confidence, so a brief
 *    confidence dip doesn't collapse a composite expression back to
 *    a plain base one.
 *  - Base → base transitions pass through dominance.js's own verdict
 *    unchanged; see the CALIBRATION FIX note below for why a prior
 *    hardcoded happy->angry->sad reroute was removed rather than kept.
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

  // Base emotion smoothing.
  // CALIBRATION FIX (transition audit): this used to also force
  // happy->angry through "sad" — but that rule fired unconditionally,
  // even when dominance.js had already computed a clean, decisive
  // angry win (see the audit trace: happy=0.748 vs angry=1.000, no
  // ambiguity). It wasn't smoothing an ambiguous call, it was
  // discarding a correct one and substituting a label the field never
  // computed — that's what produced the reported Happy -> Sad -> Angry
  // sequence, compounded by EMOTION_LOCK_DURATION holding the wrong
  // state on screen for 900ms before the engine could re-evaluate and
  // correct it. dominance.js's DOMINANCE_THRESHOLD/HYSTERESIS_THRESHOLD
  // already are the general-purpose "don't jar on a near-tie"
  // mechanism; a same-emotion hardcoded override on top of that is
  // redundant when the call is decisive and wrong when it overrides a
  // correct one. Removed rather than reconditioned, per the audit's
  // "smallest possible change" scope — there was no case in the trace
  // where this rule was doing correct, load-bearing work.

  return next;
}
